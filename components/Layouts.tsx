import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className="material-symbols-outlined">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 md:gap-3 p-1.5 pr-2 md:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
            {user?.username}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
            {user?.role}
          </p>
        </div>
        <span className="material-symbols-outlined text-slate-400 text-sm hidden md:inline">expand_more</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700/50 py-1 z-20 animate-scale-in origin-top-right">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/50">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Signed in as</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.username}</p>
            </div>

            <Link
              to={user?.role === 'voter' ? '/voter/dashboard' : '/admin/change-password'}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
      <Outlet />
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
        }`}
    >
      <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {isActive && (
        <span className="ml-auto size-1.5 rounded-full bg-white/50"></span>
      )}
    </Link>
  );
};

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 px-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-white">how_to_vote</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">SecureVote</h1>
              <p className="text-xs text-slate-500 font-medium">Admin Console</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
          <NavItem to="/admin/dashboard" icon="dashboard" label="Dashboard" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/admin/results" icon="bar_chart" label="Election Results" onClick={() => setSidebarOpen(false)} />

          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-8">Management</p>
          <NavItem to="/admin/users" icon="group" label="Users" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/admin/offices" icon="how_to_vote" label="Offices" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/admin/candidates" icon="person_add" label="Candidates" onClick={() => setSidebarOpen(false)} />

          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-8">System</p>
          <NavItem to="/admin/system-status" icon="dns" label="System Status" onClick={() => setSidebarOpen(false)} />
          <NavItem to="/admin/settings" icon="settings" label="Settings" onClick={() => setSidebarOpen(false)} />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 text-center">
              SecureVote System v1.0 <br />
              &copy; 2024
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                SecureVote Admin
              </h2>
            </div>

            {/* Search Placeholder */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex-1 max-w-md text-slate-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none w-full text-sm text-slate-900 dark:text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const VoterLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="material-symbols-outlined text-white">how_to_vote</span>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight">SecureVote</h1>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">Voter Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/voter/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Dashboard
              </Link>
              <Link to="/voter/ballot" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Ballot
              </Link>
              <Link to="/voter/analytics" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Analytics
              </Link>
              <Link to="/voter/history" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                History
              </Link>
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <span className="material-symbols-outlined">
                  {mobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
              <ThemeToggle />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
              <UserMenu />
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <Link
                to="/voter/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/voter/ballot"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Ballot
              </Link>
              <Link
                to="/voter/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Analytics
              </Link>
              <Link
                to="/voter/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                History
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; 2024 SecureVote System. All rights reserved.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>
            <span className="hidden md:inline">&bull;</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</a>
            <span className="hidden md:inline">&bull;</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
};