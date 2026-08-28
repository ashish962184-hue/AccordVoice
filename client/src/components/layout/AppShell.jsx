import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function AppShell({ children }) {
  const { user, signOut, isLocalMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Conversations', path: '/dashboard', icon: '💬' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-5 flex-shrink-0">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">
            🎙️
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
              AccordVoice
            </span>
            <span className="text-[10px] font-medium text-indigo-600 block uppercase tracking-wider">
              AI Mediation
            </span>
          </div>
        </Link>

        {/* Action Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center shadow-sm"
            onClick={() => navigate('/conversations/new')}
            icon="+"
          >
            New Conversation
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Local Mode Notice (if applicable) */}
        {isLocalMode && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-snug">
            ⚡ <strong>Local Storage Mode</strong>
            <p className="mt-0.5 text-amber-700">Running with local persistence & Gemini AI.</p>
          </div>
        )}

        {/* User Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-sm">
            🎙️
          </div>
          <span className="font-bold text-sm text-slate-900">AccordVoice</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/conversations/new')}
          >
            + New
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
