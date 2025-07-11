const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateUserRegistration, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all users (admin only)
router.get('/', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (username LIKE ? OR email LIKE ? OR name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get users (exclude password hash)
      const usersQuery = `
        SELECT id, username, email, role, name, avatar, is_active, created_at, updated_at
        FROM users 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const users = await allQuery(usersQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(users, total, page, limit));
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }
);

// Get user by ID (admin only or own profile)
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user is admin or requesting their own profile
      if (req.user.role !== 'admin' && req.user.id != userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const user = await getQuery(
        'SELECT id, username, email, role, name, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  }
);

// Update user (admin only or own profile)
router.put('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, role, name, avatar, isActive } = req.body;
      
      // Check if user is admin or updating their own profile
      if (req.user.role !== 'admin' && req.user.id != userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if user exists
      const existingUser = await getQuery('SELECT id FROM users WHERE id = ?', [userId]);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updates = [];
      const values = [];

      if (username) {
        // Check if username is already taken by another user
        const usernameExists = await getQuery('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (usernameExists) {
          return res.status(400).json({
            success: false,
            message: 'Username already exists'
          });
        }
        updates.push('username = ?');
        values.push(username);
      }

      if (email) {
        // Check if email is already taken by another user
        const emailExists = await getQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
        updates.push('email = ?');
        values.push(email);
      }

      if (role && req.user.role === 'admin') {
        if (!['admin', 'teacher', 'finance', 'librarian'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role'
          });
        }
        updates.push('role = ?');
        values.push(role);
      }

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }

      if (avatar !== undefined) {
        updates.push('avatar = ?');
        values.push(avatar);
      }

      if (isActive !== undefined && req.user.role === 'admin') {
        updates.push('is_active = ?');
        values.push(isActive ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      await runQuery(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.info(`User updated: ID ${userId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }
);

// Deactivate user (admin only)
router.put('/:id/deactivate', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Prevent admin from deactivating themselves
      if (req.user.id == userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      // Check if user exists
      const existingUser = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await runQuery(
        'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      logger.info(`User deactivated: ${existingUser.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user'
      });
    }
  }
);

// Activate user (admin only)
router.put('/:id/activate', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const existingUser = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await runQuery(
        'UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      logger.info(`User activated: ${existingUser.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'User activated successfully'
      });
    } catch (error) {
      logger.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate user'
      });
    }
  }
);

// Reset user password (admin only)
router.put('/:id/reset-password', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Check if user exists
      const existingUser = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await runQuery(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, userId]
      );

      logger.info(`Password reset for user: ${existingUser.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }
);

// Get user statistics (admin only)
router.get('/stats/overview', 
  authenticateToken, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const stats = await Promise.all([
        getQuery('SELECT COUNT(*) as total FROM users'),
        getQuery('SELECT COUNT(*) as active FROM users WHERE is_active = 1'),
        allQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
        allQuery('SELECT date(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= date("now", "-30 days") GROUP BY date(created_at) ORDER BY date')
      ]);

      const [totalResult, activeResult, roleDistribution, registrationTrends] = stats;

      res.json({
        success: true,
        data: {
          totalUsers: totalResult.total,
          activeUsers: activeResult.active,
          inactiveUsers: totalResult.total - activeResult.active,
          roleDistribution,
          registrationTrends
        }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
    }
  }
);

module.exports = router;