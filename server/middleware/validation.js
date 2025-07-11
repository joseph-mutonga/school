const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['admin', 'teacher', 'finance', 'librarian'])
    .withMessage('Invalid role specified'),
  
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim()
];

const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Student validation rules
const validateStudent = [
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .trim(),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .trim(),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  
  body('class')
    .notEmpty()
    .withMessage('Class is required'),
  
  body('stream')
    .notEmpty()
    .withMessage('Stream is required'),
  
  body('parentName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Parent name must be between 2 and 100 characters')
    .trim(),
  
  body('parentPhone')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  body('parentEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('admissionDate')
    .isISO8601()
    .withMessage('Please provide a valid admission date')
];

// Teacher validation rules
const validateTeacher = [
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .trim(),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  body('subject')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters')
    .trim(),
  
  body('dateJoined')
    .isISO8601()
    .withMessage('Please provide a valid date joined')
];

// Academic record validation rules
const validateAcademicRecord = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  
  body('subject')
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject must be between 2 and 50 characters')
    .trim(),
  
  body('term')
    .isIn(['Term 1', 'Term 2', 'Term 3'])
    .withMessage('Term must be Term 1, Term 2, or Term 3'),
  
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  body('catScore')
    .isInt({ min: 0, max: 30 })
    .withMessage('CAT score must be between 0 and 30'),
  
  body('examScore')
    .isInt({ min: 0, max: 70 })
    .withMessage('Exam score must be between 0 and 70')
];

// Fee payment validation rules
const validateFeePayment = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('paymentMethod')
    .isIn(['cash', 'mpesa', 'bank', 'cheque'])
    .withMessage('Invalid payment method'),
  
  body('term')
    .isIn(['Term 1', 'Term 2', 'Term 3'])
    .withMessage('Term must be Term 1, Term 2, or Term 3'),
  
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
];

// Attendance validation rules
const validateAttendance = [
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
  
  body('class')
    .notEmpty()
    .withMessage('Class is required')
];

// Book validation rules
const validateBook = [
  body('title')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters')
    .trim(),
  
  body('author')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author must be between 2 and 100 characters')
    .trim(),
  
  body('category')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .trim(),
  
  body('totalCopies')
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Published year must be valid')
];

// Book issue validation rules
const validateBookIssue = [
  body('bookId')
    .isInt({ min: 1 })
    .withMessage('Valid book ID is required'),
  
  body('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    })
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required')
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateLogin,
  validateStudent,
  validateTeacher,
  validateAcademicRecord,
  validateFeePayment,
  validateAttendance,
  validateBook,
  validateBookIssue,
  validateId,
  validatePagination
};