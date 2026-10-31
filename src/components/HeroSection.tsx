import React from 'react';
import { ArrowRight, Sparkles, Mic, Zap } from 'lucide-react';

interface HeroSectionProps {
  onViewBooks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onViewBooks }) => {
  return (
    <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-400/30 text-blue-100 text-xs font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Intelligent Campus Library System · SQLite & Flask Ready</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Library Management System
          </h1>

          <p className="text-base sm:text-lg text-blue-100 mb-8 leading-relaxed font-normal">
            Search available books, explore curated categories, and easily manage your campus library checkouts.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onViewBooks}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold text-sm shadow-md hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
            >
              <span>View Available Books</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                Fast Catalog Search
              </span>
              <span className="text-blue-300/60">·</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                Book Circulation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
