import React, { useState } from 'react';
import { Book, Checkout, User, AdminStats } from '../types/library';
import { 
  PlusCircle, 
  BookOpen, 
  Users, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  X,
  Globe,
  Loader2,
  Search,
  Check
} from 'lucide-react';
import { lookupBookByIsbn } from '../services/openLibrary';

interface AdminDashboardProps {
  books: Book[];
  checkouts: Checkout[];
  students: User[];
  adminStats: AdminStats;
  onAddBook: (book: Omit<Book, 'id' | 'available_quantity'>) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (bookId: number) => void;
}

const CATEGORIES = [
  'Artificial Intelligence',
  'Programming',
  'Database',
  'Networks',
  'Operating Systems',
  'Data Science',
  'Machine Learning'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  checkouts,
  students,
  adminStats,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'students' | 'history'>('books');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form states for Add / Edit
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isbn, setIsbn] = useState('');
  const [year, setYear] = useState<number>(2024);
  const [quantity, setQuantity] = useState<number>(5);
  const [isLookingUpApi, setIsLookingUpApi] = useState(false);
  const [apiLookupMessage, setApiLookupMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleLookupApi = async () => {
    if (!isbn.trim()) {
      setApiLookupMessage({ text: 'Please enter an ISBN first (e.g. 9780132350884)', isError: true });
      return;
    }
    setIsLookingUpApi(true);
    setApiLookupMessage(null);
    try {
      const bookData = await lookupBookByIsbn(isbn);
      if (bookData) {
        setTitle(bookData.title);
        setAuthor(bookData.author);
        setYear(bookData.year);
        if (CATEGORIES.includes(bookData.category)) {
          setCategory(bookData.category);
        }
        setApiLookupMessage({ 
          text: `Fetched "${bookData.title}" successfully via Free Open Library API (Zero cost · Runs on PC)!` 
        });
      } else {
        setApiLookupMessage({ 
          text: 'No matching book found in Open Library database for this ISBN.', 
          isError: true 
        });
      }
    } catch {
      setApiLookupMessage({ text: 'Could not connect to Open Library API.', isError: true });
    } finally {
      setIsLookingUpApi(false);
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setCategory(CATEGORIES[0]);
    setIsbn('9780132350884'); // Clean Code default example
    setYear(2024);
    setQuantity(5);
    setApiLookupMessage(null);
    setShowAddModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setIsbn(book.isbn);
    setYear(book.year);
    setQuantity(book.quantity);
    setApiLookupMessage(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      return;
    }

    if (editingBook) {
      onUpdateBook({
        ...editingBook,
        title: title.trim(),
        author: author.trim(),
        category,
        isbn: isbn.trim(),
        year: Number(year),
        quantity: Number(quantity),
      });
    } else {
      onAddBook({
        title: title.trim(),
        author: author.trim(),
        category,
        isbn: isbn.trim(),
        year: Number(year),
        quantity: Number(quantity),
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Management Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage books, monitor students, review checkout transactions, and manage catalog.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Admin 6-Metric Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Books
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {adminStats.totalBooks}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Available
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {adminStats.availableBooks}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Borrowed
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {adminStats.borrowedBooks}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
            Students
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {adminStats.totalStudents}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Total Checkouts
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {adminStats.totalCheckouts}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
            Total Returns
          </span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {adminStats.totalReturns}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'books'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Manage Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Manage Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Full Checkout &amp; Return Logs ({checkouts.length})
        </button>
      </div>

      {/* TAB 1: MANAGE BOOKS */}
      {activeTab === 'books' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title &amp; Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4 text-center">Available / Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{b.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.title}</div>
                      <div className="text-[11px] text-slate-500">By {b.author}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-blue-600">{b.category}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.isbn}</td>
                    <td className="py-3.5 px-4 text-slate-600">{b.year}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          b.available_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {b.available_quantity}
                      </span>
                      <span className="text-slate-400"> / {b.quantity}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Book"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteBook(b.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Registered Student Accounts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const activeCount = checkouts.filter(
                (c) => c.student_id === student.id && c.status === 'Borrowed'
              ).length;
              const returnedCount = checkouts.filter(
                (c) => c.student_id === student.id && c.status === 'Returned'
              ).length;

              return (
                <div
                  key={student.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{student.email}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-semibold text-amber-700">
                      {activeCount} Active Borrow(s)
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {returnedCount} Returned
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CHECKOUT & CHECK-IN HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Checkout Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {checkouts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900">{item.student_name}</span>
                      <div className="text-[11px] text-slate-400">{item.student_email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.book_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {item.checkout_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {item.return_date || <span className="text-slate-400 italic">Not Returned</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'Borrowed' ? (
                        <span className="font-semibold text-amber-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Borrowed</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Returned</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT BOOK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>{editingBook ? 'Edit Book Details' : 'Add New Book to Catalog'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Free Open Library API Lookup Box */}
              <div className="bg-slate-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Auto-Fill via Free Open Library API
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    100% Free · No API Key
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Enter an ISBN below (e.g., <code className="font-mono text-blue-600">9780132350884</code> or <code className="font-mono text-blue-600">9780262033848</code>) to fetch title, author, year & topic at zero cost.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Enter ISBN (e.g. 9780132350884)"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleLookupApi}
                    disabled={isLookingUpApi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 text-white font-medium text-xs rounded-md shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isLookingUpApi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Fetch Details</span>
                      </>
                    )}
                  </button>
                </div>
                {apiLookupMessage && (
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded flex items-center gap-1.5 ${
                    apiLookupMessage.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {!apiLookupMessage.isError && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                    <span>{apiLookupMessage.text}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clean Architecture"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Author *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Robert C. Martin"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-..."
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={1950}
                    max={2030}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingBook ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
