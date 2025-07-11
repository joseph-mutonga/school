const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../database/init');
const { validateLogin, validateUserRegistration, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get user from database
    const user = await getQuery(
      'SELECT id, username, email, password_hash, role, name, avatar, is_active FROM users WHERE username = ?',
      [username]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password_hash, ...userResponse } = user;

    logger.info(`User ${username} logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Register new user (admin only)
router.post('/register', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateUserRegistration, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { username, email, password, role, name } = req.body;

      // Check if user already exists
      const existingUser = await getQuery(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this username or email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Insert new user
      const result = await runQuery(
        'INSERT INTO users (username, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, role, name]
      );

      logger.info(`New user registered: ${username} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: result.id,
          username,
          email,
          role,
          name
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT id, username, email, role, name, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (avatar) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    await runQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info(`User profile updated: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    const user = await getQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    logger.info(`Password changed for user: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`User ${req.user.username} logged out`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;