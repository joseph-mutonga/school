export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'finance' | 'librarian';
  name: string;
  avatar?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  class: string;
  stream: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  admissionDate: string;
  feeBalance: number;
  status: 'active' | 'inactive';
}

export interface Teacher {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  role?: string;
  department?: string;
  classes: string[];
  dateJoined: string;
  status: 'active' | 'inactive';
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  subject: string;
  term: string;
  year: string;
  catScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  teacherId: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  term: string;
  year: string;
  paymentMethod: 'cash' | 'mpesa' | 'bank' | 'cheque';
  receiptNumber: string;
  recordedBy: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  class: string;
  recordedBy: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  issuedBy: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalBooks: number;
  feeCollection: number;
  presentToday: number;
  absentToday: number;
  booksIssued: number;
  overdueBooks: number;
}