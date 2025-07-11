import { User, Student, Teacher, AcademicRecord, FeePayment, AttendanceRecord, Book, BookIssue } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@magereza.ac.ke',
    role: 'admin',
    name: 'Joseph Maina',
    avatar: undefined
  },
  {
    id: '5',
    username: 'principal',
    email: 'principal@magereza.ac.ke',
    role: 'admin',
    name: 'Joseph Maina',
    avatar: undefined
  },
  {
    id: '2',
    username: 'teacher1',
    email: 'mary@magereza.ac.ke',
    role: 'teacher',
    name: 'Mary Wanjiku',
    avatar: undefined
  },
  {
    id: '3',
    username: 'finance1',
    email: 'peter@magereza.ac.ke',
    role: 'finance',
    name: 'Peter Otieno',
    avatar: undefined
  },
  {
    id: '4',
    username: 'librarian1',
    email: 'grace@magereza.ac.ke',
    role: 'librarian',
    name: 'Grace Muthoni',
    avatar: undefined
  }
];

export const mockStudents: Student[] = [
  {
    id: '1',
    admissionNumber: 'MAG001',
    firstName: 'James',
    lastName: 'Mwangi',
    dateOfBirth: '2008-03-15',
    gender: 'male',
    class: 'Form 4',
    stream: 'East',
    parentName: 'Samuel Mwangi',
    parentPhone: '0722345678',
    parentEmail: 'samuel.mwangi@gmail.com',
    address: 'Kitengela, Kajiado County',
    admissionDate: '2021-01-15',
    feeBalance: 15000,
    status: 'active'
  },
  {
    id: '2',
    admissionNumber: 'MAG002',
    firstName: 'Sarah',
    lastName: 'Njeri',
    dateOfBirth: '2009-07-22',
    gender: 'female',
    class: 'Form 3',
    stream: 'West',
    parentName: 'Catherine Njeri',
    parentPhone: '0733456789',
    parentEmail: 'catherine.njeri@gmail.com',
    address: 'Kitengela, Kajiado County',
    admissionDate: '2022-01-15',
    feeBalance: 8000,
    status: 'active'
  },
  {
    id: '3',
    admissionNumber: 'MAG003',
    firstName: 'David',
    lastName: 'Kipchoge',
    dateOfBirth: '2007-11-05',
    gender: 'male',
    class: 'Form 4',
    stream: 'North',
    parentName: 'John Kipchoge',
    parentPhone: '0744567890',
    parentEmail: 'john.kipchoge@gmail.com',
    address: 'Kitengela, Kajiado County',
    admissionDate: '2021-01-15',
    feeBalance: 0,
    status: 'active'
  }
];

export const mockTeachers: Teacher[] = [
  {
    id: '1',
    employeeNumber: 'MAMT001',
    firstName: 'Mr.',
    lastName: 'Nzuki',
    email: 'nzuki@magereza.ac.ke',
    phone: '0755123456',
    subject: 'Head of Academics',
    classes: ['Form 1 East', 'Form 2 West', 'Form 3 East', 'Form 4 North'],
    dateJoined: '2019-01-15',
    status: 'active'
  },
  {
    id: '2',
    employeeNumber: 'MAMT002',
    firstName: 'Mrs.',
    lastName: 'Kama',
    email: 'kama@magereza.ac.ke',
    phone: '0766234567',
    subject: 'Computer Studies',
    classes: ['Form 1 West', 'Form 2 East', 'Form 3 West', 'Form 4 East'],
    dateJoined: '2020-03-10',
    status: 'active'
  },
  {
    id: '3',
    employeeNumber: 'MAMT003',
    firstName: 'Madam',
    lastName: 'Florence',
    email: 'florence@magereza.ac.ke',
    phone: '0777345678',
    subject: 'Mathematics',
    classes: ['Form 1 North', 'Form 2 South', 'Form 3 North', 'Form 4 West'],
    dateJoined: '2018-08-20',
    status: 'active'
  },
  {
    id: '4',
    employeeNumber: 'MAMT004',
    firstName: 'Mr.',
    lastName: 'Mushangi',
    email: 'mushangi@magereza.ac.ke',
    phone: '0788456789',
    subject: 'History & Business Studies',
    classes: ['Form 1 South', 'Form 2 North', 'Form 3 South', 'Form 4 South'],
    dateJoined: '2020-01-05',
    status: 'active'
  }
];

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Advanced Mathematics for Secondary Schools',
    author: 'Dr. Kenya Mathew',
    isbn: '978-9966-25-123-4',
    category: 'Mathematics',
    totalCopies: 50,
    availableCopies: 35,
    publishedYear: '2022'
  },
  {
    id: '2',
    title: 'English Grammar and Composition',
    author: 'Prof. Sarah English',
    isbn: '978-9966-25-456-7',
    category: 'English',
    totalCopies: 40,
    availableCopies: 28,
    publishedYear: '2021'
  },
  {
    id: '3',
    title: 'Kenya History and Government',
    author: 'Dr. Historical Kenya',
    isbn: '978-9966-25-789-0',
    category: 'History',
    totalCopies: 30,
    availableCopies: 20,
    publishedYear: '2023'
  }
];

export const mockAcademicRecords: AcademicRecord[] = [
  {
    id: '1',
    studentId: '1',
    subject: 'Mathematics',
    term: 'Term 1',
    year: '2024',
    catScore: 25,
    examScore: 68,
    totalScore: 93,
    grade: 'A-',
    teacherId: '1'
  },
  {
    id: '2',
    studentId: '1',
    subject: 'English',
    term: 'Term 1',
    year: '2024',
    catScore: 22,
    examScore: 65,
    totalScore: 87,
    grade: 'B+',
    teacherId: '2'
  }
];

export const mockFeePayments: FeePayment[] = [
  {
    id: '1',
    studentId: '1',
    amount: 20000,
    paymentDate: '2024-01-15',
    term: 'Term 1',
    year: '2024',
    paymentMethod: 'mpesa',
    receiptNumber: 'MAG-001-2024',
    recordedBy: '3'
  }
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    studentId: '1',
    date: '2024-01-15',
    status: 'present',
    class: 'Form 4 East',
    recordedBy: '1'
  }
];

export const mockBookIssues: BookIssue[] = [
  {
    id: '1',
    bookId: '1',
    studentId: '1',
    issueDate: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'issued',
    issuedBy: '4'
  }
];