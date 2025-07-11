const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateAttendance, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all attendance records with pagination and filtering
router.get('/', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, class: classFilter, date, status } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (classFilter) {
        whereClause += ' AND ar.class = ?';
        params.push(classFilter);
      }

      if (date) {
        whereClause += ' AND ar.date = ?';
        params.push(date);
      }

      if (status) {
        whereClause += ' AND ar.status = ?';
        params.push(status);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        ${whereClause}
      `;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get attendance records
      const recordsQuery = `
        SELECT ar.id, ar.student_id, ar.date, ar.status, ar.class, ar.notes, ar.created_at,
               s.admission_number, s.first_name, s.last_name, s.class as student_class, s.stream,
               u.name as recorded_by_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON ar.recorded_by = u.id
        ${whereClause}
        ORDER BY ar.date DESC, ar.class, s.admission_number
        LIMIT ? OFFSET ?
      `;
      
      const records = await allQuery(recordsQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(records, total, page, limit));
    } catch (error) {
      logger.error('Get attendance records error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance records'
      });
    }
  }
);

// Get attendance record by ID
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const record = await getQuery(
        `SELECT ar.id, ar.student_id, ar.date, ar.status, ar.class, ar.notes, ar.created_at,
                s.admission_number, s.first_name, s.last_name, s.class as student_class, s.stream,
                u.name as recorded_by_name
         FROM attendance_records ar
         JOIN students s ON ar.student_id = s.id
         JOIN users u ON ar.recorded_by = u.id
         WHERE ar.id = ?`,
        [req.params.id]
      );

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Get attendance record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance record'
      });
    }
  }
);

// Mark attendance for a student
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateAttendance, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId, date, status, class: className, notes } = req.body;

      // Check if student exists
      const student = await getQuery('SELECT id FROM students WHERE id = ? AND status = "active"', [studentId]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if attendance already marked for this student, date, and class
      const existingRecord = await getQuery(
        'SELECT id FROM attendance_records WHERE student_id = ? AND date = ? AND class = ?',
        [studentId, date, className]
      );

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: 'Attendance already marked for this student, date, and class'
        });
      }

      const result = await runQuery(
        `INSERT INTO attendance_records (
          student_id, date, status, class, notes, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, date, status, className, notes, req.user.id]
      );

      logger.info(`Attendance marked: Student ${studentId}, Date ${date}, Status ${status} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: {
          id: result.id,
          studentId,
          date,
          status,
          class: className
        }
      });
    } catch (error) {
      logger.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance'
      });
    }
  }
);

// Bulk mark attendance for a class
router.post('/bulk', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  async (req, res) => {
    try {
      const { date, class: className, attendanceData } = req.body;

      if (!date || !className || !Array.isArray(attendanceData)) {
        return res.status(400).json({
          success: false,
          message: 'Date, class, and attendance data are required'
        });
      }

      const results = [];
      const errors = [];

      for (const record of attendanceData) {
        try {
          const { studentId, status, notes } = record;

          // Check if student exists
          const student = await getQuery('SELECT id FROM students WHERE id = ? AND status = "active"', [studentId]);
          if (!student) {
            errors.push(`Student ${studentId} not found`);
            continue;
          }

          // Check if attendance already exists
          const existingRecord = await getQuery(
            'SELECT id FROM attendance_records WHERE student_id = ? AND date = ? AND class = ?',
            [studentId, date, className]
          );

          if (existingRecord) {
            // Update existing record
            await runQuery(
              'UPDATE attendance_records SET status = ?, notes = ?, recorded_by = ? WHERE id = ?',
              [status, notes, req.user.id, existingRecord.id]
            );
            results.push({ studentId, action: 'updated' });
          } else {
            // Create new record
            const result = await runQuery(
              `INSERT INTO attendance_records (
                student_id, date, status, class, notes, recorded_by
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [studentId, date, status, className, notes, req.user.id]
            );
            results.push({ studentId, action: 'created', id: result.id });
          }
        } catch (error) {
          errors.push(`Error processing student ${record.studentId}: ${error.message}`);
        }
      }

      logger.info(`Bulk attendance marked: Class ${className}, Date ${date} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Bulk attendance processing completed',
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      logger.error('Bulk mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk attendance'
      });
    }
  }
);

// Update attendance record
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const recordId = req.params.id;
      const { status, notes } = req.body;

      // Check if record exists
      const existingRecord = await getQuery('SELECT id FROM attendance_records WHERE id = ?', [recordId]);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      const updates = [];
      const values = [];

      if (status) {
        if (!['present', 'absent', 'late'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Status must be present, absent, or late'
          });
        }
        updates.push('status = ?');
        values.push(status);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      values.push(req.user.id, recordId);

      await runQuery(
        `UPDATE attendance_records SET ${updates.join(', ')}, recorded_by = ? WHERE id = ?`,
        values
      );

      logger.info(`Attendance record updated: ID ${recordId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Attendance record updated successfully'
      });
    } catch (error) {
      logger.error('Update attendance record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attendance record'
      });
    }
  }
);

// Delete attendance record
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'teacher'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const recordId = req.params.id;

      // Check if record exists
      const existingRecord = await getQuery('SELECT id FROM attendance_records WHERE id = ?', [recordId]);
      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      await runQuery('DELETE FROM attendance_records WHERE id = ?', [recordId]);

      logger.info(`Attendance record deleted: ID ${recordId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      logger.error('Delete attendance record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete attendance record'
      });
    }
  }
);

// Get attendance statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { date, class: classFilter } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date) {
      whereClause += ' AND date = ?';
      params.push(date);
    }

    if (classFilter) {
      whereClause += ' AND class = ?';
      params.push(classFilter);
    }

    const stats = await Promise.all([
      getQuery(`SELECT COUNT(*) as total FROM attendance_records ${whereClause}`, params),
      getQuery(`SELECT COUNT(*) as present FROM attendance_records ${whereClause} AND status = 'present'`, params),
      getQuery(`SELECT COUNT(*) as absent FROM attendance_records ${whereClause} AND status = 'absent'`, params),
      getQuery(`SELECT COUNT(*) as late FROM attendance_records ${whereClause} AND status = 'late'`, params),
      allQuery(`SELECT class, status, COUNT(*) as count FROM attendance_records ${whereClause} GROUP BY class, status`, params)
    ]);

    const [totalResult, presentResult, absentResult, lateResult, classStats] = stats;

    res.json({
      success: true,
      data: {
        totalRecords: totalResult.total,
        presentCount: presentResult.present,
        absentCount: absentResult.absent,
        lateCount: lateResult.late,
        attendanceRate: totalResult.total > 0 ? Math.round((presentResult.present / totalResult.total) * 100) : 0,
        classBreakdown: classStats
      }
    });
  } catch (error) {
    logger.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
});

// Get class attendance for a specific date
router.get('/class/:className/:date', 
  authenticateToken, 
  async (req, res) => {
    try {
      const { className, date } = req.params;

      // Get all students in the class
      const [classLevel, stream] = className.split(' ');
      const students = await allQuery(
        'SELECT id, admission_number, first_name, last_name FROM students WHERE class = ? AND stream = ? AND status = "active" ORDER BY admission_number',
        [classLevel, stream]
      );

      // Get attendance records for the date and class
      const attendanceRecords = await allQuery(
        'SELECT student_id, status, notes FROM attendance_records WHERE class = ? AND date = ?',
        [className, date]
      );

      // Create attendance map
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        attendanceMap[record.student_id] = {
          status: record.status,
          notes: record.notes
        };
      });

      // Combine student data with attendance status
      const classAttendance = students.map(student => ({
        ...student,
        status: attendanceMap[student.id]?.status || 'not-marked',
        notes: attendanceMap[student.id]?.notes || ''
      }));

      res.json({
        success: true,
        data: {
          class: className,
          date,
          students: classAttendance,
          summary: {
            total: students.length,
            present: classAttendance.filter(s => s.status === 'present').length,
            absent: classAttendance.filter(s => s.status === 'absent').length,
            late: classAttendance.filter(s => s.status === 'late').length,
            notMarked: classAttendance.filter(s => s.status === 'not-marked').length
          }
        }
      });
    } catch (error) {
      logger.error('Get class attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class attendance'
      });
    }
  }
);

module.exports = router;