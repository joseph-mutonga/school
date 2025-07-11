const crypto = require('crypto');

// Generate unique receipt number
const generateReceiptNumber = (prefix = 'MAG') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Generate unique admission number
const generateAdmissionNumber = async (getQuery) => {
  const lastStudent = await getQuery(
    'SELECT admission_number FROM students ORDER BY id DESC LIMIT 1'
  );
  
  let nextNumber = 1;
  if (lastStudent && lastStudent.admission_number) {
    const lastNumber = parseInt(lastStudent.admission_number.replace('MAG', ''));
    nextNumber = lastNumber + 1;
  }
  
  return `MAG${String(nextNumber).padStart(3, '0')}`;
};

// Generate unique employee number
const generateEmployeeNumber = async (getQuery) => {
  const lastTeacher = await getQuery(
    'SELECT employee_number FROM teachers ORDER BY id DESC LIMIT 1'
  );
  
  let nextNumber = 1;
  if (lastTeacher && lastTeacher.employee_number) {
    const lastNumber = parseInt(lastTeacher.employee_number.replace('MAMT', ''));
    nextNumber = lastNumber + 1;
  }
  
  return `MAMT${String(nextNumber).padStart(3, '0')}`;
};

// Calculate grade from total score
const calculateGrade = (totalScore) => {
  if (totalScore >= 80) return 'A';
  if (totalScore >= 75) return 'A-';
  if (totalScore >= 70) return 'B+';
  if (totalScore >= 65) return 'B';
  if (totalScore >= 60) return 'B-';
  if (totalScore >= 55) return 'C+';
  if (totalScore >= 50) return 'C';
  if (totalScore >= 45) return 'C-';
  if (totalScore >= 40) return 'D+';
  if (totalScore >= 35) return 'D';
  if (totalScore >= 30) return 'D-';
  return 'E';
};

// Pagination helper
const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

// Format response with pagination
const formatPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Generate secure random string
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Validate Kenyan phone number
const validateKenyanPhone = (phone) => {
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  return phoneRegex.test(phone);
};

// Format phone number to international format
const formatPhoneNumber = (phone) => {
  if (phone.startsWith('0')) {
    return '+254' + phone.substring(1);
  }
  return phone;
};

// Check if date is in the past
const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

module.exports = {
  generateReceiptNumber,
  generateAdmissionNumber,
  generateEmployeeNumber,
  calculateGrade,
  getPagination,
  formatPaginatedResponse,
  sanitizeInput,
  generateSecureToken,
  validateKenyanPhone,
  formatPhoneNumber,
  isDateInPast,
  calculateAge
};