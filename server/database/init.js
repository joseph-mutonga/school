const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

const DB_PATH = path.join(__dirname, '../../database');
const DB_FILE = path.join(DB_PATH, 'school_management.db');

let db = null;

const initializeDatabase = async () => {
  try {
    // Ensure database directory exists
    await fs.mkdir(DB_PATH, { recursive: true });

    // Create database connection
    db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info('Connected to SQLite database');
    });

    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables();
    
    // Insert default data
    await insertDefaultData();

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const createTables = async () => {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'finance', 'librarian')),
      name VARCHAR(100) NOT NULL,
      avatar TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Students table
    `CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admission_number VARCHAR(20) UNIQUE NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      date_of_birth DATE NOT NULL,
      gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
      class VARCHAR(20) NOT NULL,
      stream VARCHAR(20) NOT NULL,
      parent_name VARCHAR(100) NOT NULL,
      parent_phone VARCHAR(20) NOT NULL,
      parent_email VARCHAR(100),
      address TEXT,
      admission_date DATE NOT NULL,
      fee_balance DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Teachers table
    `CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number VARCHAR(20) UNIQUE NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      role VARCHAR(50),
      department VARCHAR(50),
      date_joined DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Teacher Classes junction table
    `CREATE TABLE IF NOT EXISTS teacher_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      class_name VARCHAR(50) NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
    )`,

    // Academic Records table
    `CREATE TABLE IF NOT EXISTS academic_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject VARCHAR(50) NOT NULL,
      term VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      cat_score INTEGER DEFAULT 0 CHECK (cat_score >= 0 AND cat_score <= 30),
      exam_score INTEGER DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 70),
      total_score INTEGER GENERATED ALWAYS AS (cat_score + exam_score) STORED,
      grade VARCHAR(5),
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
    )`,

    // Fee Payments table
    `CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      term VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank', 'cheque')),
      receipt_number VARCHAR(50) UNIQUE NOT NULL,
      reference_number VARCHAR(100),
      recorded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users (id)
    )`,

    // Attendance Records table
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
      class VARCHAR(50) NOT NULL,
      recorded_by INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users (id),
      UNIQUE(student_id, date, class)
    )`,

    // Books table
    `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      author VARCHAR(100) NOT NULL,
      isbn VARCHAR(20) UNIQUE,
      category VARCHAR(50) NOT NULL,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      published_year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Book Issues table
    `CREATE TABLE IF NOT EXISTS book_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      return_date DATE,
      status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
      issued_by INTEGER NOT NULL,
      returned_by INTEGER,
      fine_amount DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (issued_by) REFERENCES users (id),
      FOREIGN KEY (returned_by) REFERENCES users (id)
    )`
  ];

  for (const table of tables) {
    await runQuery(table);
  }

  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number)',
    'CREATE INDEX IF NOT EXISTS idx_students_class ON students(class, stream)',
    'CREATE INDEX IF NOT EXISTS idx_academic_student ON academic_records(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_academic_subject ON academic_records(subject)',
    'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date)',
    'CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_book_issues_student ON book_issues(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_book_issues_book ON book_issues(book_id)'
  ];

  for (const index of indexes) {
    await runQuery(index);
  }
};

const insertDefaultData = async () => {
  // Check if users already exist
  const existingUser = await getQuery('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    logger.info('Default data already exists, skipping insertion');
    return;
  }

  // Hash default password
  const defaultPassword = await bcrypt.hash('password', 12);

  // Insert default users
  const users = [
    ['admin', 'admin@magereza.ac.ke', defaultPassword, 'admin', 'Joseph Maina'],
    ['principal', 'principal@magereza.ac.ke', defaultPassword, 'admin', 'Joseph Maina'],
    ['teacher1', 'mary@magereza.ac.ke', defaultPassword, 'teacher', 'Mary Wanjiku'],
    ['finance1', 'peter@magereza.ac.ke', defaultPassword, 'finance', 'Peter Otieno'],
    ['librarian1', 'grace@magereza.ac.ke', defaultPassword, 'librarian', 'Grace Muthoni']
  ];

  for (const user of users) {
    await runQuery(
      'INSERT INTO users (username, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
      user
    );
  }

  // Insert default teachers
  const teachers = [
    ['MAMT001', 'Mr.', 'Nzuki', 'nzuki@magereza.ac.ke', '0755123456', 'Head of Academics', 'Head of Academics', 'Administration', '2019-01-15'],
    ['MAMT002', 'Mrs.', 'Kama', 'kama@magereza.ac.ke', '0766234567', 'Computer Studies', 'Computer Teacher', 'ICT', '2020-03-10'],
    ['MAMT003', 'Madam', 'Florence', 'florence@magereza.ac.ke', '0777345678', 'Mathematics', 'Mathematics Teacher', 'Mathematics', '2018-08-20'],
    ['MAMT004', 'Mr.', 'Mushangi', 'mushangi@magereza.ac.ke', '0788456789', 'History & Business Studies', 'History & Business Teacher', 'Humanities', '2020-01-05']
  ];

  for (const teacher of teachers) {
    const result = await runQuery(
      'INSERT INTO teachers (employee_number, first_name, last_name, email, phone, subject, role, department, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      teacher
    );

    // Insert teacher classes
    const teacherClasses = {
      1: ['Form 1 East', 'Form 2 West', 'Form 3 East', 'Form 4 North'],
      2: ['Form 1 West', 'Form 2 East', 'Form 3 West', 'Form 4 East'],
      3: ['Form 1 North', 'Form 2 South', 'Form 3 North', 'Form 4 West'],
      4: ['Form 1 South', 'Form 2 North', 'Form 3 South', 'Form 4 South']
    };

    const classes = teacherClasses[result.id] || [];
    for (const className of classes) {
      await runQuery(
        'INSERT INTO teacher_classes (teacher_id, class_name) VALUES (?, ?)',
        [result.id, className]
      );
    }
  }

  // Insert default students
  const students = [
    ['MAG001', 'James', 'Mwangi', '2008-03-15', 'male', 'Form 4', 'East', 'Samuel Mwangi', '0722345678', 'samuel.mwangi@gmail.com', 'Kitengela, Kajiado County', '2021-01-15', 15000],
    ['MAG002', 'Sarah', 'Njeri', '2009-07-22', 'female', 'Form 3', 'West', 'Catherine Njeri', '0733456789', 'catherine.njeri@gmail.com', 'Kitengela, Kajiado County', '2022-01-15', 8000],
    ['MAG003', 'David', 'Kipchoge', '2007-11-05', 'male', 'Form 4', 'North', 'John Kipchoge', '0744567890', 'john.kipchoge@gmail.com', 'Kitengela, Kajiado County', '2021-01-15', 0]
  ];

  for (const student of students) {
    await runQuery(
      'INSERT INTO students (admission_number, first_name, last_name, date_of_birth, gender, class, stream, parent_name, parent_phone, parent_email, address, admission_date, fee_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      student
    );
  }

  // Insert default books
  const books = [
    ['Advanced Mathematics for Secondary Schools', 'Dr. Kenya Mathew', '978-9966-25-123-4', 'Mathematics', 50, 35, 2022],
    ['English Grammar and Composition', 'Prof. Sarah English', '978-9966-25-456-7', 'English', 40, 28, 2021],
    ['Kenya History and Government', 'Dr. Historical Kenya', '978-9966-25-789-0', 'History', 30, 20, 2023]
  ];

  for (const book of books) {
    await runQuery(
      'INSERT INTO books (title, author, isbn, category, total_copies, available_copies, published_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      book
    );
  }

  logger.info('Default data inserted successfully');
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = {
  initializeDatabase,
  getDatabase,
  runQuery,
  getQuery,
  allQuery
};