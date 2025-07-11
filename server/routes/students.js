const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateStudent, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { generateAdmissionNumber, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all students with pagination and filtering
router.get('/', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, class: classFilter, stream } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE status = "active"';
      const params = [];

      if (search) {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR admission_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (classFilter) {
        whereClause += ' AND class = ?';
        params.push(classFilter);
      }

      if (stream) {
        whereClause += ' AND stream = ?';
        params.push(stream);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM students ${whereClause}`;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get students
      const studentsQuery = `
        SELECT id, admission_number, first_name, last_name, date_of_birth, gender, 
               class, stream, parent_name, parent_phone, parent_email, address, 
               admission_date, fee_balance, status, created_at
        FROM students 
        ${whereClause} 
        ORDER BY admission_number 
        LIMIT ? OFFSET ?
      `;
      
      const students = await allQuery(studentsQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(students, total, page, limit));
    } catch (error) {
      logger.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students'
      });
    }
  }
);

// Get student by ID
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const student = await getQuery(
        `SELECT id, admission_number, first_name, last_name, date_of_birth, gender, 
                class, stream, parent_name, parent_phone, parent_email, address, 
                admission_date, fee_balance, status, created_at, updated_at
         FROM students WHERE id = ?`,
        [req.params.id]
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      logger.error('Get student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student'
      });
    }
  }
);

// Create new student
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateStudent, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const {
        firstName, lastName, dateOfBirth, gender, class: studentClass, stream,
        parentName, parentPhone, parentEmail, address, admissionDate, feeBalance = 0
      } = req.body;

      // Generate admission number
      const admissionNumber = await generateAdmissionNumber(getQuery);

      const result = await runQuery(
        `INSERT INTO students (
          admission_number, first_name, last_name, date_of_birth, gender, 
          class, stream, parent_name, parent_phone, parent_email, address, 
          admission_date, fee_balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          admissionNumber, firstName, lastName, dateOfBirth, gender,
          studentClass, stream, parentName, parentPhone, parentEmail,
          address, admissionDate, feeBalance
        ]
      );

      logger.info(`New student created: ${admissionNumber} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: {
          id: result.id,
          admissionNumber,
          firstName,
          lastName,
          class: studentClass,
          stream
        }
      });
    } catch (error) {
      logger.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student'
      });
    }
  }
);

// Update student
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const studentId = req.params.id;
      const {
        firstName, lastName, dateOfBirth, gender, class: studentClass, stream,
        parentName, parentPhone, parentEmail, address, feeBalance, status
      } = req.body;

      // Check if student exists
      const existingStudent = await getQuery('SELECT id FROM students WHERE id = ?', [studentId]);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
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
      if (dateOfBirth) {
        updates.push('date_of_birth = ?');
        values.push(dateOfBirth);
      }
      if (gender) {
        updates.push('gender = ?');
        values.push(gender);
      }
      if (studentClass) {
        updates.push('class = ?');
        values.push(studentClass);
      }
      if (stream) {
        updates.push('stream = ?');
        values.push(stream);
      }
      if (parentName) {
        updates.push('parent_name = ?');
        values.push(parentName);
      }
      if (parentPhone) {
        updates.push('parent_phone = ?');
        values.push(parentPhone);
      }
      if (parentEmail) {
        updates.push('parent_email = ?');
        values.push(parentEmail);
      }
      if (address) {
        updates.push('address = ?');
        values.push(address);
      }
      if (feeBalance !== undefined) {
        updates.push('fee_balance = ?');
        values.push(feeBalance);
      }
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(studentId);

      await runQuery(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.info(`Student updated: ID ${studentId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Student updated successfully'
      });
    } catch (error) {
      logger.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student'
      });
    }
  }
);

// Delete student (soft delete)
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const studentId = req.params.id;

      // Check if student exists
      const existingStudent = await getQuery('SELECT id, admission_number FROM students WHERE id = ?', [studentId]);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Soft delete by updating status
      await runQuery(
        'UPDATE students SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [studentId]
      );

      logger.info(`Student deleted: ${existingStudent.admission_number} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      logger.error('Delete student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student'
      });
    }
  }
);

// Get student statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      getQuery('SELECT COUNT(*) as total FROM students WHERE status = "active"'),
      getQuery('SELECT COUNT(*) as male FROM students WHERE status = "active" AND gender = "male"'),
      getQuery('SELECT COUNT(*) as female FROM students WHERE status = "active" AND gender = "female"'),
      getQuery('SELECT SUM(fee_balance) as totalOutstanding FROM students WHERE status = "active"'),
      allQuery('SELECT class, COUNT(*) as count FROM students WHERE status = "active" GROUP BY class')
    ]);

    const [totalResult, maleResult, femaleResult, feeResult, classDistribution] = stats;

    res.json({
      success: true,
      data: {
        totalStudents: totalResult.total,
        maleStudents: maleResult.male,
        femaleStudents: femaleResult.female,
        totalOutstandingFees: feeResult.totalOutstanding || 0,
        classDistribution
      }
    });
  } catch (error) {
    logger.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student statistics'
    });
  }
});

module.exports = router;