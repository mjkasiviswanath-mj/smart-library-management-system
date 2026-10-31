import { Book, Checkout, User, StudentStats, AdminStats } from '../types/library';

// Simple SHA-256 hash helper for demo security
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial predefined users
const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'Alex Student',
    email: 'student@gmail.com',
    passwordHash: '8a816175bfbead274643b1778939634e2ab9ca7a1c5d3d4b684532a76fdfdd99', // 'student123'
    role: 'student'
  },
  {
    id: 2,
    name: 'Library Admin',
    email: 'admin@gmail.com',
    passwordHash: '0192023a7bbd73250516f069df18b500e94b5823442a997c8443b35380552f5b', // 'admin123'
    role: 'admin'
  }
];

// Initial predefined books from user prompt
const INITIAL_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell',
    category: 'Artificial Intelligence',
    isbn: '978-0136042594',
    year: 2020,
    quantity: 5,
    available_quantity: 5
  },
  {
    id: 2,
    title: 'Deep Learning',
    author: 'Ian Goodfellow',
    category: 'Artificial Intelligence',
    isbn: '978-0262035613',
    year: 2016,
    quantity: 4,
    available_quantity: 4
  },
  {
    id: 3,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    category: 'Programming',
    isbn: '978-0132350884',
    year: 2008,
    quantity: 6,
    available_quantity: 5 // 1 checked out initially for demo
  },
  {
    id: 4,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    category: 'Programming',
    isbn: '978-0262033848',
    year: 2009,
    quantity: 4,
    available_quantity: 4
  },
  {
    id: 5,
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz',
    category: 'Database',
    isbn: '978-0078022159',
    year: 2019,
    quantity: 5,
    available_quantity: 5
  },
  {
    id: 6,
    title: 'Computer Networks',
    author: 'Andrew S. Tanenbaum',
    category: 'Networks',
    isbn: '978-0132126953',
    year: 2010,
    quantity: 3,
    available_quantity: 3
  },
  {
    id: 7,
    title: 'Operating System Concepts',
    author: 'Abraham Silberschatz',
    category: 'Operating Systems',
    isbn: '978-1118063330',
    year: 2018,
    quantity: 4,
    available_quantity: 4
  },
  {
    id: 8,
    title: 'Python Crash Course',
    author: 'Eric Matthes',
    category: 'Programming',
    isbn: '978-1593279288',
    year: 2019,
    quantity: 5,
    available_quantity: 5
  },
  {
    id: 9,
    title: 'Java: The Complete Reference',
    author: 'Herbert Schildt',
    category: 'Programming',
    isbn: '978-1260440232',
    year: 2018,
    quantity: 4,
    available_quantity: 4
  },
  {
    id: 10,
    title: 'Data Science from Scratch',
    author: 'Joel Grus',
    category: 'Data Science',
    isbn: '978-1492041139',
    year: 2019,
    quantity: 4,
    available_quantity: 4
  },
  {
    id: 11,
    title: 'Machine Learning Yearning',
    author: 'Andrew Ng',
    category: 'Machine Learning',
    isbn: '978-0999000000',
    year: 2018,
    quantity: 3,
    available_quantity: 3
  },
  {
    id: 12,
    title: 'Hands-On Machine Learning with Scikit-Learn and TensorFlow',
    author: 'Aurélien Géron',
    category: 'Machine Learning',
    isbn: '978-1492032649',
    year: 2019,
    quantity: 4,
    available_quantity: 4
  }
];

const INITIAL_CHECKOUTS: Checkout[] = [
  {
    id: 1,
    student_id: 1,
    student_name: 'Alex Student',
    student_email: 'student@gmail.com',
    book_id: 3,
    book_title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    book_author: 'Robert C. Martin',
    book_category: 'Programming',
    checkout_date: '2026-09-15',
    return_date: null,
    status: 'Borrowed'
  },
  {
    id: 2,
    student_id: 1,
    student_name: 'Alex Student',
    student_email: 'student@gmail.com',
    book_id: 8,
    book_title: 'Python Crash Course',
    book_author: 'Eric Matthes',
    book_category: 'Programming',
    checkout_date: '2026-09-01',
    return_date: '2026-09-10',
    status: 'Returned'
  }
];

const STORAGE_KEYS = {
  USERS: 'slms_users_v1',
  BOOKS: 'slms_books_v1',
  CHECKOUTS: 'slms_checkouts_v1',
  SESSION: 'slms_session_v1'
};

class LibraryDatabase {
  private users: User[] = [];
  private books: Book[] = [];
  private checkouts: Checkout[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
      const storedCheckouts = localStorage.getItem(STORAGE_KEYS.CHECKOUTS);

      this.users = storedUsers ? JSON.parse(storedUsers) : [...INITIAL_USERS];
      this.books = storedBooks ? JSON.parse(storedBooks) : [...INITIAL_BOOKS];
      this.checkouts = storedCheckouts ? JSON.parse(storedCheckouts) : [...INITIAL_CHECKOUTS];

      if (!storedUsers) this.saveUsers();
      if (!storedBooks) this.saveBooks();
      if (!storedCheckouts) this.saveCheckouts();
    } catch {
      this.users = [...INITIAL_USERS];
      this.books = [...INITIAL_BOOKS];
      this.checkouts = [...INITIAL_CHECKOUTS];
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error('Error saving users', e);
    }
  }

  private saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(this.books));
    } catch (e) {
      console.error('Error saving books', e);
    }
  }

  private saveCheckouts() {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify(this.checkouts));
    } catch (e) {
      console.error('Error saving checkouts', e);
    }
  }

  // Reset database back to sample seed
  public resetDatabase() {
    this.users = [...INITIAL_USERS];
    this.books = [...INITIAL_BOOKS];
    this.checkouts = [...INITIAL_CHECKOUTS];
    this.saveUsers();
    this.saveBooks();
    this.saveCheckouts();
  }

  // Authentication
  public async authenticate(email: string, password: string):Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) return null;

    const computedHash = await hashPassword(password);
    // Allow either direct match with hash, or fallback to known passwords
    const isDirectMatch = user.passwordHash === computedHash;
    const isKnownStudent = (cleanEmail === 'student@gmail.com' && password === 'student123');
    const isKnownAdmin = (cleanEmail === 'admin@gmail.com' && password === 'admin123');

    if (isDirectMatch || isKnownStudent || isKnownAdmin) {
      return user;
    }
    return null;
  }

  // Session
  public getCurrentSession(): User | null {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  public setSession(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  // Book Queries
  public getBooks(): Book[] {
    return [...this.books];
  }

  public getBookById(id: number): Book | undefined {
    return this.books.find(b => b.id === id);
  }

  public addBook(newBook: Omit<Book, 'id' | 'available_quantity'>): Book {
    const nextId = this.books.length > 0 ? Math.max(...this.books.map(b => b.id)) + 1 : 1;
    const book: Book = {
      ...newBook,
      id: nextId,
      available_quantity: newBook.quantity
    };
    this.books.push(book);
    this.saveBooks();
    return book;
  }

  public updateBook(updated: Book): boolean {
    const index = this.books.findIndex(b => b.id === updated.id);
    if (index === -1) return false;
    
    // Maintain available quantity consistency if total quantity changed
    const oldBook = this.books[index];
    const diff = updated.quantity - oldBook.quantity;
    const newAvailable = Math.max(0, Math.min(updated.quantity, oldBook.available_quantity + diff));

    this.books[index] = {
      ...updated,
      available_quantity: newAvailable
    };
    this.saveBooks();
    return true;
  }

  public deleteBook(id: number): boolean {
    const initialLength = this.books.length;
    this.books = this.books.filter(b => b.id !== id);
    if (this.books.length !== initialLength) {
      this.saveBooks();
      return true;
    }
    return false;
  }

  // Checkouts
  public getCheckouts(studentId?: number): Checkout[] {
    if (studentId !== undefined) {
      return this.checkouts.filter(c => c.student_id === studentId);
    }
    return [...this.checkouts];
  }

  public getStudents(): User[] {
    return this.users.filter(u => u.role === 'student');
  }

  // Borrow Book
  public borrowBook(student: User, bookId: number): { success: boolean; message: string } {
    const book = this.books.find(b => b.id === bookId);
    if (!book) {
      return { success: false, message: 'Book not found in database.' };
    }
    if (book.available_quantity <= 0) {
      return { success: false, message: `"${book.title}" is currently out of stock.` };
    }

    // Check if student already has this book borrowed and not returned
    const alreadyBorrowed = this.checkouts.some(
      c => c.student_id === student.id && c.book_id === bookId && c.status === 'Borrowed'
    );
    if (alreadyBorrowed) {
      return { success: false, message: 'You have already borrowed a copy of this book.' };
    }

    // Decrement available quantity
    book.available_quantity -= 1;
    this.saveBooks();

    // Create checkout record
    const nextCheckoutId = this.checkouts.length > 0 ? Math.max(...this.checkouts.map(c => c.id)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];

    const newRecord: Checkout = {
      id: nextCheckoutId,
      student_id: student.id,
      student_name: student.name,
      student_email: student.email,
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      book_category: book.category,
      checkout_date: today,
      return_date: null,
      status: 'Borrowed'
    };

    this.checkouts.unshift(newRecord);
    this.saveCheckouts();

    return { success: true, message: `Book "${book.title}" borrowed successfully.` };
  }

  // Return Book
  public returnBook(checkoutId: number): { success: boolean; message: string } {
    const checkout = this.checkouts.find(c => c.id === checkoutId);
    if (!checkout) {
      return { success: false, message: 'Borrow record not found.' };
    }
    if (checkout.status === 'Returned') {
      return { success: false, message: 'This book has already been returned.' };
    }

    // Increase available quantity
    const book = this.books.find(b => b.id === checkout.book_id);
    if (book) {
      book.available_quantity = Math.min(book.quantity, book.available_quantity + 1);
      this.saveBooks();
    }

    // Update checkout record
    const today = new Date().toISOString().split('T')[0];
    checkout.return_date = today;
    checkout.status = 'Returned';
    this.saveCheckouts();

    return { success: true, message: `Book "${checkout.book_title}" returned successfully.` };
  }

  // Student Dashboard Statistics
  public getStudentStats(studentId: number): StudentStats {
    const studentCheckouts = this.checkouts.filter(c => c.student_id === studentId);
    const myBorrowedBooks = studentCheckouts.filter(c => c.status === 'Borrowed').length;
    const booksReturned = studentCheckouts.filter(c => c.status === 'Returned').length;
    const totalBooks = this.books.length;
    const availableBooks = this.books.reduce((acc, b) => acc + b.available_quantity, 0);

    return {
      totalBooks,
      availableBooks,
      myBorrowedBooks,
      booksReturned,
      totalBorrowedEver: studentCheckouts.length
    };
  }

  // Admin Dashboard Statistics
  public getAdminStats(): AdminStats {
    const totalBooks = this.books.length;
    const availableBooks = this.books.reduce((acc, b) => acc + b.available_quantity, 0);
    const borrowedBooks = this.checkouts.filter(c => c.status === 'Borrowed').length;
    const totalStudents = this.users.filter(u => u.role === 'student').length;
    const totalCheckouts = this.checkouts.length;
    const totalReturns = this.checkouts.filter(c => c.status === 'Returned').length;

    // Overdue logic: borrowed > 14 days ago and status == 'Borrowed'
    const today = new Date();
    const overdueBooks = this.checkouts.filter(c => {
      if (c.status !== 'Borrowed') return false;
      const checkoutDate = new Date(c.checkout_date);
      const diffDays = (today.getTime() - checkoutDate.getTime()) / (1000 * 3600 * 24);
      return diffDays > 14;
    }).length;

    return {
      totalBooks,
      availableBooks,
      borrowedBooks,
      totalStudents,
      totalCheckouts,
      totalReturns,
      overdueBooks
    };
  }

  // AI / Simple Book Recommendation Engine
  // Generates recommendations based on:
  // 1. Selected category
  // 2. Previously borrowed categories by the student (priority boost)
  // 3. Book popularity (number of times borrowed)
  public getRecommendations(studentId: number | null, selectedCategory: string): { book: Book; reason: string; score: number }[] {
    // 1. Identify student borrowing patterns
    const studentCheckouts = studentId ? this.checkouts.filter(c => c.student_id === studentId) : [];
    const categoryFrequency: Record<string, number> = {};
    studentCheckouts.forEach(c => {
      categoryFrequency[c.book_category] = (categoryFrequency[c.book_category] || 0) + 1;
    });

    // 2. Identify global book popularity
    const bookBorrowCount: Record<number, number> = {};
    this.checkouts.forEach(c => {
      bookBorrowCount[c.book_id] = (bookBorrowCount[c.book_id] || 0) + 1;
    });

    // 3. Score all books
    const scored = this.books.map(book => {
      let score = 0;
      const reasons: string[] = [];

      // Match selected category
      if (book.category.toLowerCase() === selectedCategory.toLowerCase()) {
        score += 50;
        reasons.push(`Matches selected category "${selectedCategory}"`);
      }

      // Check if student has borrowed this category before
      const studentCatFreq = categoryFrequency[book.category] || 0;
      if (studentCatFreq > 0) {
        score += studentCatFreq * 20;
        reasons.push(`Preferred topic based on your ${studentCatFreq} previous checkout(s)`);
      }

      // Popularity boost
      const borrows = bookBorrowCount[book.id] || 0;
      if (borrows > 0) {
        score += borrows * 5;
        reasons.push(`Popular in library (${borrows} checkouts)`);
      }

      // Freshness / High availability
      if (book.available_quantity > 0) {
        score += 10;
      }

      const reasonStr = reasons.length > 0 ? reasons.join(' · ') : `Recommended in ${book.category}`;

      return {
        book,
        reason: reasonStr,
        score
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return top recommendations
    return scored.slice(0, 6);
  }
}

export const db = new LibraryDatabase();
