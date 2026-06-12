// src/pages/admin/AdminDashboard.jsx
/**
 * AdminDashboard — admin-only control panel.
 *
 * Tabs:
 *  1. Users     — list all users, change roles, delete accounts
 *  2. Jobs      — list all jobs, toggle active/inactive, delete jobs
 *  3. Stats     — quick platform statistics
 *
 * Only accessible to users with role === 'admin'.
 * Routes are protected in App.jsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Briefcase, BarChart2, Trash2, ShieldCheck, RefreshCw,
  ToggleLeft, ToggleRight, Search, AlertTriangle, Loader2,
} from 'lucide-react';
import api from '../../api/axios';

// ── Role badge colours ────────────────────────────────────────────────────────
const roleBadge = {
  admin:     'bg-purple-100 text-purple-700',
  recruiter: 'bg-blue-100 text-blue-700',
  jobseeker: 'bg-green-100 text-green-700',
};

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'users', label: 'Users',     icon: Users },
  { id: 'jobs',  label: 'Jobs',      icon: Briefcase },
  { id: 'stats', label: 'Statistics', icon: BarChart2 },
];

// ── Helper: format date ───────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AdminDashboard = () => {
  const [activeTab,   setActiveTab]   = useState('users');

  // Users state
  const [users,       setUsers]       = useState([]);
  const [userSearch,  setUserSearch]  = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Jobs state
  const [jobs,        setJobs]        = useState([]);
  const [jobSearch,   setJobSearch]   = useState('');
  const [jobsLoading, setJobsLoading] = useState(false);

  // Stats state
  const [stats,       setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ── Fetch jobs ────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const { data } = await api.get('/admin/jobs');
      setJobs(data.jobs || []);
    } catch (err) {
      toast.error('Failed to load jobs.');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats || data);
    } catch (err) {
      toast.error('Failed to load statistics.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'jobs')  fetchJobs();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab, fetchUsers, fetchJobs, fetchStats]);

  // ── Change user role ──────────────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('User role updated.');
    } catch (err) {
      toast.error('Failed to update role.');
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted.');
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  // ── Toggle job active status ──────────────────────────────────────────────
  const handleToggleJob = async (jobId) => {
    try {
      await api.patch(`/jobs/${jobId}/status`);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, isActive: !j.isActive } : j))
      );
      toast.success('Job status updated.');
    } catch (err) {
      toast.error('Failed to toggle job status.');
    }
  };

  // ── Delete job ────────────────────────────────────────────────────────────
  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Delete job "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Job deleted.');
    } catch (err) {
      toast.error('Failed to delete job.');
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)  ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const filteredJobs = jobs.filter((j) =>
    j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.location?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Manage users, jobs, and platform health.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="card">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="font-semibold text-gray-900">
                All Users ({filteredUsers.length})
              </h2>
              <div className="flex gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-9 pr-3 py-1.5 text-sm w-56"
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="btn-secondary p-2"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 font-medium text-gray-500">Name</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Email</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Role</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Joined</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Verified</th>
                      <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-3 text-gray-600">{user.email}</td>
                        <td className="py-3">
                          {/* Role selector */}
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className={`badge cursor-pointer border-0 focus:outline-none ${roleBadge[user.role] || 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="jobseeker">jobseeker</option>
                            <option value="recruiter">recruiter</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3 text-gray-500">{fmtDate(user.createdAt)}</td>
                        <td className="py-3">
                          {user.isVerified ? (
                            <span className="badge bg-green-100 text-green-700">Yes</span>
                          ) : (
                            <span className="badge bg-red-100 text-red-600">No</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() =>
                              handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)
                            }
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── JOBS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'jobs' && (
          <div className="card">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="font-semibold text-gray-900">
                All Jobs ({filteredJobs.length})
              </h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-9 pr-3 py-1.5 text-sm w-56"
                    placeholder="Search jobs…"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                  />
                </div>
                <button onClick={fetchJobs} className="btn-secondary p-2" title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No jobs found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 font-medium text-gray-500">Title</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Company</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Location</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Posted</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                      <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900 max-w-[180px] truncate">
                          {job.title}
                        </td>
                        <td className="py-3 text-gray-600">
                          {job.company?.name || job.recruiterId?.company || '—'}
                        </td>
                        <td className="py-3 text-gray-600">{job.location}</td>
                        <td className="py-3 text-gray-500">{fmtDate(job.createdAt)}</td>
                        <td className="py-3">
                          {job.isActive ? (
                            <span className="badge bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-600">Inactive</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Toggle status */}
                            <button
                              onClick={() => handleToggleJob(job._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                job.isActive
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={job.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {job.isActive ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteJob(job._id, job.title)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div>
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users',        value: stats.totalUsers       ?? '—', color: 'blue'   },
                  { label: 'Total Jobs',          value: stats.totalJobs        ?? '—', color: 'indigo' },
                  { label: 'Total Applications',  value: stats.totalApplications ?? '—', color: 'green'  },
                  { label: 'Active Jobs',          value: stats.activeJobs       ?? '—', color: 'yellow' },
                  { label: 'Recruiters',           value: stats.totalRecruiters  ?? '—', color: 'purple' },
                  { label: 'Job Seekers',          value: stats.totalSeekers     ?? '—', color: 'pink'   },
                  { label: 'Hired This Month',     value: stats.hiredThisMonth   ?? '—', color: 'emerald'},
                  { label: 'New Users (30d)',       value: stats.newUsersThisMonth ?? '—', color: 'cyan'  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card">
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-600">Could not load statistics.</p>
                <button onClick={fetchStats} className="btn-secondary mt-3">
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
