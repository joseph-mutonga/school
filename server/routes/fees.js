const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateFeePayment, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { generateReceiptNumber, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get all fee payments with pagination and filtering
router.get('/', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, term, year, paymentMethod } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? OR fp.receipt_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (term) {
        whereClause += ' AND fp.term = ?';
        params.push(term);
      }

      if (year) {
        whereClause += ' AND fp.year = ?';
        params.push(year);
      }

      if (paymentMethod) {
        whereClause += ' AND fp.payment_method = ?';
        params.push(paymentMethod);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM fee_payments fp
        JOIN students s ON fp.student_id = s.id
        ${whereClause}
      `;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get fee payments
      const paymentsQuery = `
        SELECT fp.id, fp.student_id, fp.amount, fp.payment_date, fp.term, fp.year,
               fp.payment_method, fp.receipt_number, fp.reference_number, fp.created_at,
               s.admission_number, s.first_name, s.last_name, s.class, s.stream,
               u.name as recorded_by_name
        FROM fee_payments fp
        JOIN students s ON fp.student_id = s.id
        JOIN users u ON fp.recorded_by = u.id
        ${whereClause}
        ORDER BY fp.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const payments = await allQuery(paymentsQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(payments, total, page, limit));
    } catch (error) {
      logger.error('Get fee payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee payments'
      });
    }
  }
);

// Get fee payment by ID
router.get('/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const payment = await getQuery(
        `SELECT fp.id, fp.student_id, fp.amount, fp.payment_date, fp.term, fp.year,
                fp.payment_method, fp.receipt_number, fp.reference_number, fp.created_at,
                s.admission_number, s.first_name, s.last_name, s.class, s.stream,
                u.name as recorded_by_name
         FROM fee_payments fp
         JOIN students s ON fp.student_id = s.id
         JOIN users u ON fp.recorded_by = u.id
         WHERE fp.id = ?`,
        [req.params.id]
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Fee payment not found'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Get fee payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee payment'
      });
    }
  }
);

// Record new fee payment
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'finance'), 
  validateFeePayment, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId, amount, paymentMethod, term, year, referenceNumber } = req.body;

      // Check if student exists
      const student = await getQuery('SELECT id, fee_balance FROM students WHERE id = ? AND status = "active"', [studentId]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Generate receipt number
      const receiptNumber = generateReceiptNumber();
      const paymentDate = new Date().toISOString().split('T')[0];

      // Record payment
      const result = await runQuery(
        `INSERT INTO fee_payments (
          student_id, amount, payment_date, term, year, payment_method, 
          receipt_number, reference_number, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, amount, paymentDate, term, year, paymentMethod, receiptNumber, referenceNumber, req.user.id]
      );

      // Update student fee balance
      const newBalance = Math.max(0, student.fee_balance - amount);
      await runQuery(
        'UPDATE students SET fee_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, studentId]
      );

      logger.info(`Fee payment recorded: ${receiptNumber} for student ${studentId} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Fee payment recorded successfully',
        data: {
          id: result.id,
          receiptNumber,
          amount,
          paymentMethod,
          newBalance
        }
      });
    } catch (error) {
      logger.error('Record fee payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record fee payment'
      });
    }
  }
);

// Update fee payment
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'finance'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const paymentId = req.params.id;
      const { amount, paymentMethod, referenceNumber } = req.body;

      // Check if payment exists
      const existingPayment = await getQuery(
        'SELECT id, student_id, amount as old_amount FROM fee_payments WHERE id = ?', 
        [paymentId]
      );
      
      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          message: 'Fee payment not found'
        });
      }

      const updates = [];
      const values = [];

      if (amount !== undefined) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (paymentMethod) {
        updates.push('payment_method = ?');
        values.push(paymentMethod);
      }
      if (referenceNumber) {
        updates.push('reference_number = ?');
        values.push(referenceNumber);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      values.push(paymentId);

      await runQuery(
        `UPDATE fee_payments SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // If amount changed, update student balance
      if (amount !== undefined && amount !== existingPayment.old_amount) {
        const student = await getQuery('SELECT fee_balance FROM students WHERE id = ?', [existingPayment.student_id]);
        const balanceDifference = existingPayment.old_amount - amount;
        const newBalance = Math.max(0, student.fee_balance + balanceDifference);
        
        await runQuery(
          'UPDATE students SET fee_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newBalance, existingPayment.student_id]
        );
      }

      logger.info(`Fee payment updated: ID ${paymentId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Fee payment updated successfully'
      });
    } catch (error) {
      logger.error('Update fee payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fee payment'
      });
    }
  }
);

// Delete fee payment
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const paymentId = req.params.id;

      // Get payment details before deletion
      const payment = await getQuery(
        'SELECT id, student_id, amount, receipt_number FROM fee_payments WHERE id = ?', 
        [paymentId]
      );
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Fee payment not found'
        });
      }

      // Delete payment
      await runQuery('DELETE FROM fee_payments WHERE id = ?', [paymentId]);

      // Restore student balance
      const student = await getQuery('SELECT fee_balance FROM students WHERE id = ?', [payment.student_id]);
      const newBalance = student.fee_balance + payment.amount;
      
      await runQuery(
        'UPDATE students SET fee_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, payment.student_id]
      );

      logger.info(`Fee payment deleted: ${payment.receipt_number} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Fee payment deleted successfully'
      });
    } catch (error) {
      logger.error('Delete fee payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete fee payment'
      });
    }
  }
);

// Get fee statistics
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
      getQuery(`SELECT SUM(amount) as total FROM fee_payments ${whereClause}`, params),
      getQuery(`SELECT COUNT(*) as count FROM fee_payments ${whereClause}`, params),
      getQuery('SELECT SUM(fee_balance) as outstanding FROM students WHERE status = "active"'),
      getQuery('SELECT COUNT(*) as students_with_balance FROM students WHERE status = "active" AND fee_balance > 0'),
      allQuery(`SELECT payment_method, SUM(amount) as total FROM fee_payments ${whereClause} GROUP BY payment_method`, params)
    ]);

    const [totalResult, countResult, outstandingResult, balanceCountResult, methodDistribution] = stats;

    res.json({
      success: true,
      data: {
        totalCollection: totalResult.total || 0,
        totalPayments: countResult.count,
        totalOutstanding: outstandingResult.outstanding || 0,
        studentsWithBalance: balanceCountResult.students_with_balance,
        paymentMethodDistribution: methodDistribution
      }
    });
  } catch (error) {
    logger.error('Get fee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee statistics'
    });
  }
});

// Get student fee history
router.get('/student/:studentId', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Check if student exists
      const student = await getQuery(
        'SELECT id, first_name, last_name, admission_number, fee_balance FROM students WHERE id = ?', 
        [studentId]
      );
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const payments = await allQuery(
        `SELECT fp.id, fp.amount, fp.payment_date, fp.term, fp.year,
                fp.payment_method, fp.receipt_number, fp.reference_number, fp.created_at,
                u.name as recorded_by_name
         FROM fee_payments fp
         JOIN users u ON fp.recorded_by = u.id
         WHERE fp.student_id = ?
         ORDER BY fp.created_at DESC`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          student,
          payments
        }
      });
    } catch (error) {
      logger.error('Get student fee history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student fee history'
      });
    }
  }
);

module.exports = router;