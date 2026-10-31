import React, { useState } from 'react';
import { Book, User } from '../types/library';
import { Sparkles, BookOpen, Check, AlertCircle } from 'lucide-react';

interface RecommendationSectionProps {
  currentUser: User | null;
  onBorrowBook: (bookId: number) => void;
  getRecommendations: (category: string) => { book: Book; reason: string; score: number }[];
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

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  currentUser,
  onBorrowBook,
  getRecommendations,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Artificial Intelligence');

  const recommendations = getRecommendations(selectedCategory);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Book Recommendation
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Choose a category to see some recommended books.
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="category-select" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Category:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Algorithm Explanation Note */}
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] tracking-wide">
              SMART ALGORITHM
            </span>
            <span>
              Recommendation is generated based on user borrowing history and book category.
            </span>
          </div>
          <span className="text-[11px] text-blue-600/80 font-mono">
            Category weights + Borrow pattern scoring
          </span>
        </div>

        {/* Recommended Books Cards Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(({ book, reason }) => {
            const isAvailable = book.available_quantity > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-blue-300"
              >
                <div>
                  {/* Category & Year metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                    <span className="font-medium text-blue-600">
                      {book.category}
                    </span>
                    <span>{book.year}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {book.title}
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    By {book.author}
                  </p>

                  {/* AI Recommendation Reason */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-emerald-700 bg-emerald-50/60 px-2.5 py-1.5 rounded-md flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{reason}</span>
                  </div>
                </div>

                {/* Card Footer: Availability & Borrow action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    {isAvailable ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Available ({book.available_quantity})
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Out of stock
                      </span>
                    )}
                  </div>

                  {currentUser?.role === 'admin' ? (
                    <span className="text-xs text-slate-400 font-medium">
                      Admin Mode
                    </span>
                  ) : (
                    <button
                      onClick={() => onBorrowBook(book.id)}
                      disabled={!isAvailable}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isAvailable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Borrow Book
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
