import React from 'react';
import { User, StudentStats, AdminStats } from '../types/library';
import { BookOpen, CheckCircle, BookmarkCheck, Users, RotateCcw, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  currentUser: User | null;
  studentStats: StudentStats;
  adminStats: AdminStats;
  onNavigateTab?: (tab: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  currentUser,
  studentStats,
  adminStats,
  onNavigateTab,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
      {/* Primary 3 Cards matching original frontend layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Books Card */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('books')}
          className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Books
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {isAdmin ? adminStats.totalBooks : studentStats.totalBooks}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Titles cataloged in library</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Available Books Card */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('books')}
          className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
              Available Books
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {isAdmin ? adminStats.availableBooks : studentStats.availableBooks}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Ready for immediate checkout</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Borrowed Books Card */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('borrowed')}
          className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
              {isAdmin ? 'Borrowed Books' : 'My Borrowed Books'}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {isAdmin ? adminStats.borrowedBooks : studentStats.myBorrowedBooks}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? 'Currently checked out by students' : 'Active loans on your account'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Role-specific secondary statistics bar */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-white/70 backdrop-blur-xs p-3 rounded-lg border border-slate-200/50">
        {isAdmin ? (
          <>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Total Students: <strong className="text-slate-900 font-semibold">{adminStats.totalStudents}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-blue-500" />
                <span>Total Checkouts: <strong className="text-slate-900 font-semibold">{adminStats.totalCheckouts}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-emerald-500" />
                <span>Total Returns: <strong className="text-slate-900 font-semibold">{adminStats.totalReturns}</strong></span>
              </span>
            </div>
            {adminStats.overdueBooks > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{adminStats.overdueBooks} Overdue Loan(s)</span>
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-500" />
              <span>Books Returned: <strong className="text-slate-900 font-semibold">{studentStats.booksReturned}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-blue-500" />
              <span>Lifetime Borrowed: <strong className="text-slate-900 font-semibold">{studentStats.totalBorrowedEver}</strong></span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              Real-time database updates from SQLite engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
