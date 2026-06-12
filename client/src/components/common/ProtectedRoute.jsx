// src/components/common/ProtectedRoute.jsx
/**
 * ProtectedRoute — wraps private routes.
 *
 * Props:
 *  - allowedRoles: string[]  — if provided, only those roles can access
 *  - redirectTo: string      — where to redirect on failure (default: /login)
 *
 * Behaviour:
 *  1. While auth is loading (silent refresh in progress) → show spinner
 *  2. Not authenticated → redirect to /login (preserving intended URL)
 *  3. Authenticated but wrong role → redirect to /unauthorized
 *  4. All good → render <Outlet />
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], redirectTo = '/login' }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // ── 1. Still loading auth state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── 2. Not authenticated ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    // Save the attempted location so we can redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ── 3. Role check ─────────────────────────────────────────────────────────
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── 4. Authorised ─────────────────────────────────────────────────────────
  return <Outlet />;
};

export default ProtectedRoute;
