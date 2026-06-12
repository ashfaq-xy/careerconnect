// src/components/layout/Navbar.jsx
/**
 * Navbar — responsive top navigation bar.
 *
 * Features:
 *  - Brand logo + name
 *  - Public links: Jobs
 *  - Role-aware links: "Post a Job" (recruiter), "My Applications" (jobseeker), "Admin" (admin)
 *  - Notification bell with unread badge (authenticated only)
 *  - User avatar menu: Profile display + Logout
 *  - Mobile hamburger menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from '../common/NotificationPanel';

// Helper: active link class
const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors px-1 py-0.5 ${
    isActive
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-600 hover:text-gray-900'
  }`;

const Navbar = () => {
  const { user, isAuthenticated, isRecruiter, isAdmin, isJobSeeker, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  // UI state
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);

  // Refs for click-outside detection
  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  // Build initials for avatar
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ──────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              CareerConnect
            </span>
          </Link>

          {/* ── Desktop nav links ───────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/jobs" className={navLinkClass}>
              Browse Jobs
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="flex items-center gap-1">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </span>
              </NavLink>
            )}

            {/* Recruiter-only */}
            {isRecruiter && (
              <NavLink to="/jobs/create" className={navLinkClass}>
                <span className="flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Post a Job
                </span>
              </NavLink>
            )}

            {/* Seeker-only */}
            {isJobSeeker && (
              <NavLink to="/my-applications" className={navLinkClass}>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  My Applications
                </span>
              </NavLink>
            )}

            {/* Admin-only */}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              </NavLink>
            )}
          </div>

          {/* ── Right side: auth controls ───────────────────────────── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {/* Notification dropdown */}
                  {notifOpen && (
                    <NotificationPanel onClose={() => setNotifOpen(false)} />
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="User menu"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.firstName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                          {user?.role}
                        </span>
                      </div>
                      {/* Actions */}
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Not authenticated */
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm px-3 py-1.5">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          <Link
            to="/jobs"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            Browse Jobs
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </Link>

              {isRecruiter && (
                <Link
                  to="/jobs/create"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Post a Job
                </Link>
              )}

              {isJobSeeker && (
                <Link
                  to="/my-applications"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  My Applications
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Admin Panel
                </Link>
              )}

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary w-full justify-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full justify-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
