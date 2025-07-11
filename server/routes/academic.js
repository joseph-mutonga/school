const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateAcademicRecord, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { calculateGrade, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all academic records with pagination and filtering
router.get('/', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, subject, class: classFilter, term, year } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (subject) {
        whereClause += ' AND ar.subject = ?';
        params.push(subject);
      }

      if (classFilter) {
        whereClause += ' AND s.class = ?';
        params.push(classFilter);
      }

      if (term) {
        whereClause += ' AND ar.term = ?';
        params.push(term);
      }

      if (year) {
        whereClause += ' AND ar.year = ?';
        params.push(year);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
      `;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get academic records
      const recordsQuery = `
        SELECT ar.id, ar.student_id, ar.subject, ar.term, ar.year, 
               ar.cat_score, ar.exam_score, ar.total_score, ar.grade,
               ar.created_at, ar.updated_at,
               s.admission_number, s.first_name, s.last_name, s.class, s.stream,
               t.first_name as teacher_first_name, t.last_name as teacher_last_name
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.id
        LEFT JOIN teachers t ON ar.teacher_id = t.id
        ${whereClause}
        ORDER BY ar.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const records = await allQuery(recordsQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(records, total, page, limit));
    } catch (error) {
      logger.error('Get academic records error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch academic records'
      });
    }
  }
);

// Get academic record by ID
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const record = await getQuery(
        `SELECT ar.id, ar.student_id, ar.subject, ar.term, ar.year, 
                ar.cat_score, ar.exam_score, ar.total_score, ar.grade,
                ar.created_at, ar.updated_at,
                s.admission_number, s.first_name, s.last_name, s.class, s.stream,
                t.first_name as teacher_first_name, t.last_name as teacher_last_name
         FROM academic_records ar
         JOIN students s ON ar.student_id = s.id
         LEFT JOIN teachers t ON ar.teacher_id = t.id
         WHERE ar.id = ?`,
        [req.params.id]
      );

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Academic record not found'
        });
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Get academic record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch academic record'
      });
    }
  }
);

// Create new academic record
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateAcademicRecord, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId, subject, term, year, catScore, examScore, teacherId } = req.body;

      // Check if student exists
      const student = await getQuery('SELECT id FROM students WHERE id = ? AND status = "active"', [studentId]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if record already exists for this student, subject, term, and year
      const existingRecord = await getQuery(
        'SELECT id FROM academic_records WHERE student_id = ? AND subject = ? AND term = ? AND year = ?',
        [studentId, subject, term, year]
      );

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: 'Academic record already exists for this student, subject, term, and year'
        });
      }

      // Calculate total score and grade
      const totalScore = catScore + examScore;
      const grade = calculateGrade(totalScore);

      const result = await runQuery(
        `INSERT INTO academic_records (
          student_id, subject, term, year, cat_score, exam_score, grade, teacher_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, subject, term, year, catScore, examScore, grade, teacherId || req.user.id]
      );

      logger.info(`Academic record created: Student ${studentId}, Subject ${subject} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Academic record created successfully',
        data: {
          id: result.id,
          studentId,
          subject,
          term,
          year,
          catScore,
          examScore,
          totalScore,
          grade
        }
      });
    } catch (error) {
      logger.error('Create academic record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create academic record'
      });
    }
  }
);

// Update academic record
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const recordId = req.params.id;
      const { catScore, examScore, teacherId } = req.body;

      // Check if record exists
      const existingRecord = await getQuery('SELECT id FROM academic_records WHERE id = ?', [recordId]);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Academic record not found'
        });
      }

      const updates = [];
      const values = [];

      if (catScore !== undefined) {
        if (catScore < 0 || catScore > 30) {
          return res.status(400).json({
            success: false,
            message: 'CAT score must be between 0 and 30'
          });
        }
        updates.push('cat_score = ?');
        values.push(catScore);
      }

      if (examScore !== undefined) {
        if (examScore < 0 || examScore > 70) {
          return res.status(400).json({
            success: false,
            message: 'Exam score must be between 0 and 70'
          });
        }
        updates.push('exam_score = ?');
        values.push(examScore);
      }

      if (teacherId) {
        updates.push('teacher_id = ?');
        values.push(teacherId);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      // If scores are being updated, recalculate grade
      if (catScore !== undefined || examScore !== undefined) {
        const currentRecord = await getQuery(
          'SELECT cat_score, exam_score FROM academic_records WHERE id = ?',
          [recordId]
        );
        
        const newCatScore = catScore !== undefined ? catScore : currentRecord.cat_score;
        const newExamScore = examScore !== undefined ? examScore : currentRecord.exam_score;
        const totalScore = newCatScore + newExamScore;
        const grade = calculateGrade(totalScore);
        
        updates.push('grade = ?');
        values.push(grade);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(recordId);

      await runQuery(
        `UPDATE academic_records SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.info(`Academic record updated: ID ${recordId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Academic record updated successfully'
      });
    } catch (error) {
      logger.error('Update academic record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update academic record'
      });
    }
  }
);

// Delete academic record
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const recordId = req.params.id;

      // Check if record exists
      const existingRecord = await getQuery('SELECT id FROM academic_records WHERE id = ?', [recordId]);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Academic record not found'
        });
      }

      await runQuery('DELETE FROM academic_records WHERE id = ?', [recordId]);

      logger.info(`Academic record deleted: ID ${recordId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Academic record deleted successfully'
      });
    } catch (error) {
      logger.error('Delete academic record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete academic record'
      });
    }
  }
);

// Get academic statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { term, year } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (term) {
      whereClause += ' AND term = ?';
      params.push(term);
    }

    if (year) {
      whereClause += ' AND year = ?';
      params.push(year);
    }

    const stats = await Promise.all([
      getQuery(`SELECT COUNT(*) as total FROM academic_records ${whereClause}`, params),
      getQuery(`SELECT AVG(total_score) as average FROM academic_records ${whereClause}`, params),
      allQuery(`SELECT subject, AVG(total_score) as average, COUNT(*) as count FROM academic_records ${whereClause} GROUP BY subject`, params),
      allQuery(`SELECT grade, COUNT(*) as count FROM academic_records ${whereClause} GROUP BY grade`, params)
    ]);

    const [totalResult, averageResult, subjectStats, gradeDistribution] = stats;

    res.json({
      success: true,
      data: {
        totalRecords: totalResult.total,
        overallAverage: Math.round(averageResult.average || 0),
        subjectPerformance: subjectStats,
        gradeDistribution
      }
    });
  } catch (error) {
    logger.error('Get academic stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch academic statistics'
    });
  }
});

// Get student's academic history
router.get('/student/:studentId', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Check if student exists
      const student = await getQuery('SELECT id, first_name, last_name FROM students WHERE id = ?', [studentId]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const records = await allQuery(
        `SELECT ar.id, ar.subject, ar.term, ar.year, ar.cat_score, ar.exam_score, 
                ar.total_score, ar.grade, ar.created_at,
                t.first_name as teacher_first_name, t.last_name as teacher_last_name
         FROM academic_records ar
         LEFT JOIN teachers t ON ar.teacher_id = t.id
         WHERE ar.student_id = ?
         ORDER BY ar.year DESC, ar.term DESC, ar.subject`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          student,
          records
        }
      });
    } catch (error) {
      logger.error('Get student academic history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student academic history'
      });
    }
  }
);

module.exports = router;