const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateBook, validateBookIssue, validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { logger } = require('../utils/logger');

const router = express.Router();

// Books routes

// Get all books with pagination and filtering
router.get('/books', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, category } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM books ${whereClause}`;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get books
      const booksQuery = `
        SELECT id, title, author, isbn, category, total_copies, available_copies, 
               published_year, created_at, updated_at
        FROM books 
        ${whereClause} 
        ORDER BY title 
        LIMIT ? OFFSET ?
      `;
      
      const books = await allQuery(booksQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(books, total, page, limit));
    } catch (error) {
      logger.error('Get books error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch books'
      });
    }
  }
);

// Get book by ID
router.get('/books/:id', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const book = await getQuery(
        `SELECT id, title, author, isbn, category, total_copies, available_copies, 
                published_year, created_at, updated_at
         FROM books WHERE id = ?`,
        [req.params.id]
      );

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.json({
        success: true,
        data: book
      });
    } catch (error) {
      logger.error('Get book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book'
      });
    }
  }
);

// Add new book
router.post('/books', 
  authenticateToken, 
  authorizeRoles('admin', 'librarian'), 
  validateBook, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { title, author, isbn, category, totalCopies, publishedYear } = req.body;

      // Check if ISBN already exists
      if (isbn) {
        const existingBook = await getQuery('SELECT id FROM books WHERE isbn = ?', [isbn]);
        if (existingBook) {
          return res.status(400).json({
            success: false,
            message: 'Book with this ISBN already exists'
          });
        }
      }

      const result = await runQuery(
        `INSERT INTO books (
          title, author, isbn, category, total_copies, available_copies, published_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, author, isbn, category, totalCopies, totalCopies, publishedYear]
      );

      logger.info(`New book added: ${title} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Book added successfully',
        data: {
          id: result.id,
          title,
          author,
          isbn,
          category,
          totalCopies
        }
      });
    } catch (error) {
      logger.error('Add book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add book'
      });
    }
  }
);

// Update book
router.put('/books/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'librarian'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const bookId = req.params.id;
      const { title, author, isbn, category, totalCopies, publishedYear } = req.body;

      // Check if book exists
      const existingBook = await getQuery('SELECT id, available_copies FROM books WHERE id = ?', [bookId]);
      if (!existingBook) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      const updates = [];
      const values = [];

      if (title) {
        updates.push('title = ?');
        values.push(title);
      }
      if (author) {
        updates.push('author = ?');
        values.push(author);
      }
      if (isbn) {
        updates.push('isbn = ?');
        values.push(isbn);
      }
      if (category) {
        updates.push('category = ?');
        values.push(category);
      }
      if (totalCopies !== undefined) {
        // Adjust available copies based on the change in total copies
        const currentBook = await getQuery('SELECT total_copies, available_copies FROM books WHERE id = ?', [bookId]);
        const issuedCopies = currentBook.total_copies - currentBook.available_copies;
        const newAvailableCopies = Math.max(0, totalCopies - issuedCopies);
        
        updates.push('total_copies = ?', 'available_copies = ?');
        values.push(totalCopies, newAvailableCopies);
      }
      if (publishedYear) {
        updates.push('published_year = ?');
        values.push(publishedYear);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(bookId);

      await runQuery(
        `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      logger.info(`Book updated: ID ${bookId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Book updated successfully'
      });
    } catch (error) {
      logger.error('Update book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update book'
      });
    }
  }
);

// Delete book
router.delete('/books/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'librarian'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const bookId = req.params.id;

      // Check if book exists
      const existingBook = await getQuery('SELECT id, title FROM books WHERE id = ?', [bookId]);
      if (!existingBook) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      // Check if book has active issues
      const activeIssues = await getQuery(
        'SELECT COUNT(*) as count FROM book_issues WHERE book_id = ? AND status = "issued"',
        [bookId]
      );

      if (activeIssues.count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete book with active issues'
        });
      }

      await runQuery('DELETE FROM books WHERE id = ?', [bookId]);

      logger.info(`Book deleted: ${existingBook.title} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      logger.error('Delete book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete book'
      });
    }
  }
);

// Book Issues routes

// Get all book issues with pagination and filtering
router.get('/issues', 
  authenticateToken, 
  validatePagination, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const { limit: queryLimit, offset } = getPagination(page, limit);

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (b.title LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        whereClause += ' AND bi.status = ?';
        params.push(status);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM book_issues bi
        JOIN books b ON bi.book_id = b.id
        JOIN students s ON bi.student_id = s.id
        ${whereClause}
      `;
      const countResult = await getQuery(countQuery, params);
      const total = countResult.total;

      // Get book issues
      const issuesQuery = `
        SELECT bi.id, bi.book_id, bi.student_id, bi.issue_date, bi.due_date, 
               bi.return_date, bi.status, bi.fine_amount, bi.created_at,
               b.title, b.author, b.isbn,
               s.admission_number, s.first_name, s.last_name, s.class, s.stream,
               u1.name as issued_by_name, u2.name as returned_by_name
        FROM book_issues bi
        JOIN books b ON bi.book_id = b.id
        JOIN students s ON bi.student_id = s.id
        JOIN users u1 ON bi.issued_by = u1.id
        LEFT JOIN users u2 ON bi.returned_by = u2.id
        ${whereClause}
        ORDER BY bi.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const issues = await allQuery(issuesQuery, [...params, queryLimit, offset]);

      res.json(formatPaginatedResponse(issues, total, page, limit));
    } catch (error) {
      logger.error('Get book issues error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book issues'
      });
    }
  }
);

// Issue a book
router.post('/issues', 
  authenticateToken, 
  authorizeRoles('admin', 'librarian'), 
  validateBookIssue, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { bookId, studentId, dueDate } = req.body;

      // Check if book exists and is available
      const book = await getQuery('SELECT id, title, available_copies FROM books WHERE id = ?', [bookId]);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Book is not available for issue'
        });
      }

      // Check if student exists
      const student = await getQuery('SELECT id FROM students WHERE id = ? AND status = "active"', [studentId]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if student already has this book issued
      const existingIssue = await getQuery(
        'SELECT id FROM book_issues WHERE book_id = ? AND student_id = ? AND status = "issued"',
        [bookId, studentId]
      );

      if (existingIssue) {
        return res.status(400).json({
          success: false,
          message: 'Student already has this book issued'
        });
      }

      const issueDate = new Date().toISOString().split('T')[0];

      // Create book issue record
      const result = await runQuery(
        `INSERT INTO book_issues (
          book_id, student_id, issue_date, due_date, issued_by
        ) VALUES (?, ?, ?, ?, ?)`,
        [bookId, studentId, issueDate, dueDate, req.user.id]
      );

      // Update book available copies
      await runQuery(
        'UPDATE books SET available_copies = available_copies - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bookId]
      );

      logger.info(`Book issued: ${book.title} to student ${studentId} by ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Book issued successfully',
        data: {
          id: result.id,
          bookId,
          studentId,
          issueDate,
          dueDate
        }
      });
    } catch (error) {
      logger.error('Issue book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to issue book'
      });
    }
  }
);

// Return a book
router.put('/issues/:id/return', 
  authenticateToken, 
  authorizeRoles('admin', 'librarian'), 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const issueId = req.params.id;
      const { fineAmount = 0 } = req.body;

      // Check if issue exists and is active
      const issue = await getQuery(
        'SELECT id, book_id, student_id, due_date, status FROM book_issues WHERE id = ?',
        [issueId]
      );

      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Book issue not found'
        });
      }

      if (issue.status !== 'issued') {
        return res.status(400).json({
          success: false,
          message: 'Book is not currently issued'
        });
      }

      const returnDate = new Date().toISOString().split('T')[0];
      let status = 'returned';

      // Check if book is overdue
      if (new Date(returnDate) > new Date(issue.due_date)) {
        status = 'returned'; // Still mark as returned, but we can track it was overdue
      }

      // Update book issue record
      await runQuery(
        `UPDATE book_issues SET 
         return_date = ?, status = ?, fine_amount = ?, returned_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [returnDate, status, fineAmount, req.user.id, issueId]
      );

      // Update book available copies
      await runQuery(
        'UPDATE books SET available_copies = available_copies + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [issue.book_id]
      );

      logger.info(`Book returned: Issue ID ${issueId} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Book returned successfully',
        data: {
          issueId,
          returnDate,
          fineAmount
        }
      });
    } catch (error) {
      logger.error('Return book error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to return book'
      });
    }
  }
);

// Get library statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Promise.all([
      getQuery('SELECT COUNT(*) as total FROM books'),
      getQuery('SELECT SUM(total_copies) as totalCopies FROM books'),
      getQuery('SELECT SUM(available_copies) as availableCopies FROM books'),
      getQuery('SELECT COUNT(*) as issued FROM book_issues WHERE status = "issued"'),
      getQuery('SELECT COUNT(*) as overdue FROM book_issues WHERE status = "issued" AND due_date < date("now")'),
      allQuery('SELECT category, COUNT(*) as count FROM books GROUP BY category')
    ]);

    const [totalBooks, totalCopies, availableCopies, issuedBooks, overdueBooks, categoryDistribution] = stats;

    res.json({
      success: true,
      data: {
        totalBooks: totalBooks.total,
        totalCopies: totalCopies.totalCopies || 0,
        availableCopies: availableCopies.availableCopies || 0,
        issuedBooks: issuedBooks.issued,
        overdueBooks: overdueBooks.overdue,
        categoryDistribution
      }
    });
  } catch (error) {
    logger.error('Get library stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch library statistics'
    });
  }
});

// Get student's book history
router.get('/student/:studentId', 
  authenticateToken, 
  validateId, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // Check if student exists
      const student = await getQuery(
        'SELECT id, first_name, last_name, admission_number FROM students WHERE id = ?', 
        [studentId]
      );
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const issues = await allQuery(
        `SELECT bi.id, bi.issue_date, bi.due_date, bi.return_date, bi.status, bi.fine_amount,
                b.title, b.author, b.isbn,
                u1.name as issued_by_name, u2.name as returned_by_name
         FROM book_issues bi
         JOIN books b ON bi.book_id = b.id
         JOIN users u1 ON bi.issued_by = u1.id
         LEFT JOIN users u2 ON bi.returned_by = u2.id
         WHERE bi.student_id = ?
         ORDER BY bi.created_at DESC`,
        [studentId]
      );

      res.json({
        success: true,
        data: {
          student,
          issues
        }
      });
    } catch (error) {
      logger.error('Get student book history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student book history'
      });
    }
  }
);

module.exports = router;