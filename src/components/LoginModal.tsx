import React, { useState } from 'react';
import { User } from '../types/library';
import { Lock, Mail, Shield, User as UserIcon, AlertCircle, X, KeyRound, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; user?: User; error?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await onLogin(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Invalid credentials. Please verify email and password.');
    }
  };

  const handleFillDemo = (type: 'student' | 'admin') => {
    if (type === 'student') {
      setEmail('student@gmail.com');
      setPassword('student123');
    } else {
      setEmail('admin@gmail.com');
      setPassword('admin123');
    }
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Library Account Login
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Student &amp; Admin Role-Based Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com or admin@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to Library'}
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              College Review Demo Quick-Fill
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="p-2.5 text-left border border-blue-200 bg-blue-50/70 hover:bg-blue-100 rounded-lg text-xs transition-colors cursor-pointer group"
              >
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Demo</span>
                </div>
                <div className="text-[10px] text-blue-600 mt-1 font-mono">
                  student@gmail.com
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  pass: student123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="p-2.5 text-left border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg text-xs transition-colors cursor-pointer group"
              >
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Demo</span>
                </div>
                <div className="text-[10px] text-indigo-600 mt-1 font-mono">
                  admin@gmail.com
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  pass: admin123
                </div>
              </button>
            </div>

            {/* Security note */}
            <div className="mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Passwords securely verified using SHA-256 / Werkzeug hash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
