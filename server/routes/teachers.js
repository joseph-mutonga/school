const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateTeacher, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { generateEmployeeNumber, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all teachers with pagination and filtering
router.get('/', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, department } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE t.status = "active"';
      const params = [];

      if (search) {
        whereClause += ' AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.employee_number LIKE ? OR t.subject LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (department) {
        whereClause += ' AND t.department = ?';
        params.push(department);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM teachers t ${whereClause}`;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get teachers with their classes
      const teachersQuery = `
        SELECT t.id, t.employee_number, t.first_name, t.last_name, t.email, t.phone, 
               t.subject, t.role, t.department, t.date_joined, t.status, t.created_at,
               GROUP_CONCAT(tc.class_name) as classes
        FROM teachers t
        LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
        ${whereClause}
        GROUP BY t.id
        ORDER BY t.employee_number 
        LIMIT ? OFFSET ?
      `;
      
      const teachers = await allQuery(teachersQuery, [...params, queryLimit, offset]);

      // Format classes as array
      const formattedTeachers = teachers.map(teacher => ({
        ...teacher,
        classes: teacher.classes ? teacher.classes.split(',') : []
      }));

      res.json(formatPaginatedResponse(formattedTeachers, total, page, limit));
    } catch (error) {
      logger.error('Get teachers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers'
      });
    }
  }
);

// Get teacher by ID
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const teacher = await getQuery(
        `SELECT id, employee_number, first_name, last_name, email, phone, 
                subject, role, department, date_joined, status, created_at, updated_at
         FROM teachers WHERE id = ?`,
        [req.params.id]
      );

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Get teacher's classes
      const classes = await allQuery(
        'SELECT class_name FROM teacher_classes WHERE teacher_id = ?',
        [req.params.id]
      );

      teacher.classes = classes.map(c => c.class_name);

      res.json({
        success: true,
        data: teacher
      });
    } catch (error) {
      logger.error('Get teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher'
      });
    }
  }
);

// Create new teacher
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateTeacher, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const {
        firstName, lastName, email, phone, subject, role, department, dateJoined, classes = []
      } = req.body;

      // Check if email already exists
      const existingTeacher = await getQuery('SELECT id FROM teachers WHERE email = ?', [email]);
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Teacher with this email already exists'
        });
      }

      // Generate employee number
      const employeeNumber = await generateEmployeeNumber(getQuery);

      const result = await runQuery(
        `INSERT INTO teachers (
          employee_number, first_name, last_name, email, phone, 
          subject, role, department, date_joined
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [employeeNumber, firstName, lastName, email, phone, subject, role, department, dateJoined]
      );

      // Insert teacher classes
      if (classes.length > 0) {
        for (const className of classes) {
          await runQuery(
            'INSERT INTO teacher_classes (teacher_id, class_name) VALUES (?, ?)',
            [result.id, className]
          );
        }
      }

      logger.info(`New teacher created: ${employeeNumber} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: {
          id: result.id,
          employeeNumber,
          firstName,
          lastName,
          email,
          subject
        }
      });
    } catch (error) {
      logger.error('Create teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create teacher'
      });
    }
  }
);

// Update teacher
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const teacherId = req.params.id;
      const {
        firstName, lastName, email, phone, subject, role, department, status, classes
      } = req.body;

      // Check if teacher exists
      const existingTeacher = await getQuery('SELECT id FROM teachers WHERE id = ?', [teacherId]);
      if (!existingTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const updates = [];
      const values = [];

      if (firstName) {
        updates.push('first_name = ?');
        values.push(firstName);
      }
      if (lastName) {
        updates.push('last_name = ?');
        values.push(lastName);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (phone) {
        updates.push('phone = ?');
        values.push(phone);
      }
      if (subject) {
        updates.push('subject = ?');
        values.push(subject);
      }
      if (role) {
        updates.push('role = ?');
        values.push(role);
      }
      if (department) {
        updates.push('department = ?');
        values.push(department);
      }
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(teacherId);

        await runQuery(
          `UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update teacher classes if provided
      if (classes && Array.isArray(classes)) {
        // Delete existing classes
        await runQuery('DELETE FROM teacher_classes WHERE teacher_id = ?', [teacherId]);
        
        // Insert new classes
        for (const className of classes) {
          await runQuery(
            'INSERT INTO teacher_classes (teacher_id, class_name) VALUES (?, ?)',
            [teacherId, className]
          );
        }
      }

      logger.info(`Teacher updated: ID ${teacherId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Teacher updated successfully'
      });
    } catch (error) {
      logger.error('Update teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher'
      });
    }
  }
);

// Delete teacher (soft delete)
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const teacherId = req.params.id;

      // Check if teacher exists
      const existingTeacher = await getQuery('SELECT id, employee_number FROM teachers WHERE id = ?', [teacherId]);
      if (!existingTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Soft delete by updating status
      await runQuery(
        'UPDATE teachers SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [teacherId]
      );

      logger.info(`Teacher deleted: ${existingTeacher.employee_number} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      logger.error('Delete teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete teacher'
      });
    }
  }
);

// Get teacher statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      getQuery('SELECT COUNT(*) as total FROM teachers WHERE status = "active"'),
      allQuery('SELECT department, COUNT(*) as count FROM teachers WHERE status = "active" GROUP BY department'),
      allQuery('SELECT subject, COUNT(*) as count FROM teachers WHERE status = "active" GROUP BY subject')
    ]);

    const [totalResult, departmentDistribution, subjectDistribution] = stats;

    res.json({
      success: true,
      data: {
        totalTeachers: totalResult.total,
        departmentDistribution,
        subjectDistribution
      }
    });
  } catch (error) {
    logger.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher statistics'
    });
  }
});

module.exports = router;