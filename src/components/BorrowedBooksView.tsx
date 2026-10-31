import React, { useState } from 'react';
import { Checkout, User } from '../types/library';
import { BookmarkCheck, RotateCcw, Clock, CheckCircle2, BookOpen } from 'lucide-react';

interface BorrowedBooksViewProps {
  checkouts: Checkout[];
  currentUser: User | null;
  onReturnBook: (checkoutId: number) => void;
  onNavigateToBooks: () => void;
}

export const BorrowedBooksView: React.FC<BorrowedBooksViewProps> = ({
  checkouts,
  currentUser,
  onReturnBook,
  onNavigateToBooks,
}) => {
  const [filterMode, setFilterMode] = useState<'current' | 'history' | 'all'>('current');

  const isAdmin = currentUser?.role === 'admin';

  // Filter based on user role
  const relevantCheckouts = isAdmin
    ? checkouts
    : checkouts.filter((c) => c.student_id === currentUser?.id);

  // Filter based on current status vs history
  const activeCheckouts = relevantCheckouts.filter((c) => c.status === 'Borrowed');
  const returnedHistory = relevantCheckouts.filter((c) => c.status === 'Returned');

  const displayedList =
    filterMode === 'current'
      ? activeCheckouts
      : filterMode === 'history'
      ? returnedHistory
      : relevantCheckouts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? 'All Borrowed Books & Records' : 'My Borrowed Books'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Comprehensive student checkout log and active library loans.'
              : 'Keep track of your active book loans and return books on time.'}
          </p>
        </div>

        {/* Status filter toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilterMode('current')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'current'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Currently Borrowed ({activeCheckouts.length})
          </button>
          <button
            onClick={() => setFilterMode('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'history'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Returned History ({returnedHistory.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs ({relevantCheckouts.length})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              No records found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterMode === 'current'
                ? 'You do not have any borrowed books at the moment.'
                : 'No borrowing history matching this filter.'}
            </p>
            <button
              onClick={onNavigateToBooks}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Browse Available Books
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isAdmin && <th className="py-3.5 px-4">Student</th>}
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Checkout Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedList.map((item) => {
                  const isBorrowed = item.status === 'Borrowed';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Admin student info column */}
                      {isAdmin && (
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900">
                            {item.student_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.student_email}
                          </div>
                        </td>
                      )}

                      {/* Book info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {item.book_title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          By {item.book_author}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-600">
                          {item.book_category}
                        </span>
                      </td>

                      {/* Checkout date */}
                      <td className="py-4 px-4 text-slate-600 font-mono">
                        {item.checkout_date}
                      </td>

                      {/* Return date */}
                      <td className="py-4 px-4 text-slate-600 font-mono">
                        {item.return_date || (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isBorrowed ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Not Returned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Returned</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        {isBorrowed ? (
                          <button
                            onClick={() => onReturnBook(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return Book</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
