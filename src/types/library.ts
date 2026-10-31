export type Role = 'student' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string; // Stored securely
  role: Role;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  year: number;
  quantity: number;
  available_quantity: number;
}

export interface Checkout {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  book_id: number;
  book_title: string;
  book_author: string;
  book_category: string;
  checkout_date: string;
  return_date: string | null;
  status: 'Borrowed' | 'Returned';
}

export type SortField = 'title' | 'author' | 'year' | 'category';

export interface StudentStats {
  totalBooks: number;
  availableBooks: number;
  myBorrowedBooks: number;
  booksReturned: number;
  totalBorrowedEver: number;
}

export interface AdminStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  totalStudents: number;
  totalCheckouts: number;
  totalReturns: number;
  overdueBooks: number;
}
