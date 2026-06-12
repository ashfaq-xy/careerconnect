// src/App.jsx
// PRD v2 §7.1 — Page Map & Routes
// All routes exactly match PRD v2 §7.1

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Lazy-load all pages — PRD v2 §9.1 (React.lazy for code splitting)
const Login          = lazy(() => import('./pages/auth/Login'));
const Register       = lazy(() => import('./pages/auth/Register'));
const VerifyEmail    = lazy(() => import('./pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/auth/ResetPassword'));
const JobListing         = lazy(() => import('./pages/jobs/JobListing'));
const JobDetail          = lazy(() => import('./pages/jobs/JobDetail'));
const CreateJob          = lazy(() => import('./pages/jobs/CreateJob'));
const EditJob            = lazy(() => import('./pages/jobs/EditJob'));
const SeekerDashboard    = lazy(() => import('./pages/dashboard/SeekerDashboard'));
const RecruiterDashboard = lazy(() => import('./pages/dashboard/RecruiterDashboard'));
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboard'));

// ── System pages ──────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-2">
      <span className="text-4xl font-display font-black text-slate-300">404</span>
    </div>
    <p className="font-display font-bold text-xl text-slate-900">Page not found</p>
    <p className="text-slate-500 text-sm">The page you're looking for doesn't exist.</p>
    <a href="/jobs" className="btn-primary mt-2">Browse Jobs</a>
  </div>
);

// PRD v2 §7.1 — /unauthorized route, links to /jobs (safe for all roles)
const Unauthorized = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-2 border border-rose-100">
      <span className="text-4xl font-display font-black text-rose-200">403</span>
    </div>
    <p className="font-display font-bold text-xl text-slate-900">Access Denied</p>
    <p className="text-slate-500 text-sm text-center max-w-xs">
      You don't have permission to view this page.
    </p>
    <div className="flex gap-3 mt-2">
      <a href="/jobs" className="btn-secondary">Browse Jobs</a>
      <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
    </div>
  </div>
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600" />
  </div>
);

// PRD v2 §7.1 — /dashboard routes to role-specific dashboard
const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <PageLoader />;
  if (user.role === 'recruiter') return <RecruiterDashboard />;
  if (user.role === 'admin')     return <AdminDashboard />;
  return <SeekerDashboard />;
};

const App = () => (
  <AuthProvider>
    <NotificationProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PRD v2 §7.1 — / redirects to /jobs */}
          <Route path="/" element={<Navigate to="/jobs" replace />} />

          {/* Public auth routes — no Layout wrapper */}
          <Route path="/login"                 element={<Login />} />
          <Route path="/register"              element={<Register />} />
          <Route path="/verify-email"          element={<VerifyEmail />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Routes with Navbar + Footer layout */}
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/jobs"     element={<JobListing />} />
            <Route path="/jobs/:id" element={<JobDetail />} />

            {/* Authenticated (any role) — PRD v2 §7.1 /dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
            </Route>

            {/* Job Seeker only — PRD v2 §7.1 /my-applications */}
            <Route element={<ProtectedRoute allowedRoles={['jobseeker']} />}>
              <Route path="/my-applications" element={<SeekerDashboard />} />
            </Route>

            {/* Recruiter / Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['recruiter', 'admin']} />}>
              <Route path="/jobs/create"   element={<CreateJob />} />
              <Route path="/jobs/:id/edit" element={<EditJob />} />
              {/* PRD v2 §7.1 — /recruiter route (explicit) */}
              <Route path="/recruiter"     element={<RecruiterDashboard />} />
            </Route>

            {/* Admin only — PRD v2 §7.1 /admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* System pages — PRD v2 §7.1 */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*"             element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </NotificationProvider>
  </AuthProvider>
);

export default App;
