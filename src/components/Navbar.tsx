import React from 'react';
import { User } from '../types/library';
import { BookOpen, User as UserIcon, Shield, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-white group-hover:text-blue-300 transition-colors">
                Library Management System
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                Digital Catalog &amp; Circulation Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('books')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'books'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Available Books
            </button>
            <button
              onClick={() => setCurrentTab('borrowed')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'borrowed'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Borrowed Books
            </button>

            {/* Admin Dashboard tab if Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Admin Dashboard
              </button>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* User Session Info / Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-blue-400 uppercase font-mono tracking-wider flex items-center justify-end gap-1">
                    {currentUser.role === 'admin' ? (
                      <>
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-2.5 h-2.5" />
                        Student
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-red-950/40 hover:border-red-800/50 border border-slate-700 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-all shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
