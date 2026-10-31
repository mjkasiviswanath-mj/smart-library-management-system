/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/storage';
import { Book, User, Checkout } from './types/library';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StatsCards } from './components/StatsCards';
import { RecommendationSection } from './components/RecommendationSection';
import { AvailableBooksView } from './components/AvailableBooksView';
import { BorrowedBooksView } from './components/BorrowedBooksView';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginModal } from './components/LoginModal';
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Database reactive state
  const [books, setBooks] = useState<Book[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync data from database engine
  const refreshData = () => {
    setBooks(db.getBooks());
    setCheckouts(db.getCheckouts());
    setStudents(db.getStudents());
  };

  useEffect(() => {
    // Initial data load
    refreshData();
    // Check if user session exists in localStorage
    const savedSession = db.getCurrentSession();
    if (savedSession) {
      setCurrentUser(savedSession);
    } else {
      // Default to student login for seamless initial demo experience
      const defaultStudent = db.getStudents()[0];
      if (defaultStudent) {
        setCurrentUser(defaultStudent);
        db.setSession(defaultStudent);
      }
    }
  }, []);

  // Authentication Handlers
  const handleLogin = async (email: string, pass: string) => {
    const user = await db.authenticate(email, pass);
    if (user) {
      setCurrentUser(user);
      db.setSession(user);
      showToast(`Welcome back, ${user.name}! (${user.role === 'admin' ? 'Admin' : 'Student'})`, 'success');
      return { success: true, user };
    }
    return { success: false, error: 'Invalid email or password. Please try again.' };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    db.setSession(null);
    showToast('You have been logged out.', 'info');
    setCurrentTab('home');
  };

  // Borrow Book Handler
  const handleBorrowBook = (bookId: number) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      showToast('Please log in as a student to borrow books.', 'info');
      return;
    }
    if (currentUser.role === 'admin') {
      showToast('Admins cannot borrow books. Please switch to a student account.', 'error');
      return;
    }

    const res = db.borrowBook(currentUser, bookId);
    if (res.success) {
      refreshData();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Return Book Handler
  const handleReturnBook = (checkoutId: number) => {
    const res = db.returnBook(checkoutId);
    if (res.success) {
      refreshData();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Admin Book Management Handlers
  const handleAddBook = (newBook: Omit<Book, 'id' | 'available_quantity'>) => {
    if (currentUser?.role !== 'admin') {
      showToast('Access Denied: Admin permission required.', 'error');
      return;
    }
    const created = db.addBook(newBook);
    refreshData();
    showToast(`Book "${created.title}" added to catalog.`, 'success');
  };

  const handleUpdateBook = (updatedBook: Book) => {
    if (currentUser?.role !== 'admin') {
      showToast('Access Denied: Admin permission required.', 'error');
      return;
    }
    const ok = db.updateBook(updatedBook);
    if (ok) {
      refreshData();
      showToast(`Book "${updatedBook.title}" updated.`, 'success');
    }
  };

  const handleDeleteBook = (bookId: number) => {
    if (currentUser?.role !== 'admin') {
      showToast('Access Denied: Admin permission required.', 'error');
      return;
    }
    const book = db.getBookById(bookId);
    const ok = db.deleteBook(bookId);
    if (ok) {
      refreshData();
      showToast(`Book "${book?.title || 'Unknown'}" removed from catalog.`, 'success');
    }
  };

  // Recommendations query
  const getRecommendations = (category: string) => {
    return db.getRecommendations(currentUser?.id || null, category);
  };

  // Computed statistics
  const studentStats = db.getStudentStats(currentUser?.id || 1);
  const adminStats = db.getAdminStats();

  // Tab navigation guard
  const handleNavigateTab = (tab: string) => {
    if (tab === 'admin' && currentUser?.role !== 'admin') {
      showToast('Access Denied. Only library admins can access the admin dashboard.', 'error');
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {/* VIEW 1: HOME PAGE */}
        {currentTab === 'home' && (
          <div>
            <HeroSection onViewBooks={() => handleNavigateTab('books')} />

            {/* Statistics Cards */}
            <StatsCards
              currentUser={currentUser}
              studentStats={studentStats}
              adminStats={adminStats}
              onNavigateTab={handleNavigateTab}
            />

            {/* AI Book Recommendation Section */}
            <RecommendationSection
              currentUser={currentUser}
              onBorrowBook={handleBorrowBook}
              getRecommendations={getRecommendations}
            />
          </div>
        )}

        {/* VIEW 2: AVAILABLE BOOKS PAGE */}
        {currentTab === 'books' && (
          <AvailableBooksView
            books={books}
            currentUser={currentUser}
            onBorrowBook={handleBorrowBook}
            onEditBook={currentUser?.role === 'admin' ? handleUpdateBook : undefined}
            onDeleteBook={currentUser?.role === 'admin' ? handleDeleteBook : undefined}
          />
        )}

        {/* VIEW 3: BORROWED BOOKS PAGE */}
        {currentTab === 'borrowed' && (
          <BorrowedBooksView
            checkouts={checkouts}
            currentUser={currentUser}
            onReturnBook={handleReturnBook}
            onNavigateToBooks={() => handleNavigateTab('books')}
          />
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          <>
            {currentUser?.role === 'admin' ? (
              <AdminDashboard
                books={books}
                checkouts={checkouts}
                students={students}
                adminStats={adminStats}
                onAddBook={handleAddBook}
                onUpdateBook={handleUpdateBook}
                onDeleteBook={handleDeleteBook}
              />
            ) : (
              <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-xl shadow-md border border-rose-200 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-xs text-slate-600 mt-2">
                  This section is restricted to administrative staff. Please sign in with an admin account (admin@gmail.com).
                </p>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Switch to Admin Account
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      {/* Consistent Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Library Management System</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Digital Catalog &amp; Circulation Management</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>SQLite Database</span>
            <span>·</span>
            <span>Python Flask Backend</span>
            <span>·</span>
            <span>Circulation System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
