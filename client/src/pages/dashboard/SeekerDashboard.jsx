// src/pages/dashboard/SeekerDashboard.jsx
// PRD v2 FR-APP-02 — displays all non-withdrawn applications
// PRD v2 FR-APP-04 — statuses: applied | shortlisted | interview | offered | rejected
// PRD v2 FR-APP-05 — seeker can withdraw; applicationCount decrements

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Briefcase, Clock, CheckCircle, XCircle, Eye, Trash2, Search,
  Target, Star, Calendar, Award,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMyApplications, withdrawApplication } from '../../api/application.api';
import { useAuth } from '../../context/AuthContext';

// PRD v2 §3.3 Application model status enum
const STATUS_CONFIG = {
  applied:     { label: 'Applied',     icon: Clock,        bg: 'bg-slate-50',    text: 'text-slate-600',   border: 'border-slate-200'   },
  reviewing:   { label: 'In Review',   icon: Eye,          bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200'     },
  shortlisted: { label: 'Shortlisted', icon: Star,         bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200'  },
  interview:   { label: 'Interview',   icon: Calendar,     bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  offered:     { label: 'Offered! 🎉', icon: Award,        bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected:    { label: 'Rejected',    icon: XCircle,      bg: 'bg-rose-50',     text: 'text-rose-600',    border: 'border-rose-200'    },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className={`text-2xl font-display font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

const FILTER_TABS = ['all', 'applied', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];

const SeekerDashboard = () => {
  const { user } = useAuth();
  const [applications,  setApplications]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [filter,        setFilter]        = useState('all');

  useEffect(() => {
    getMyApplications()
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => toast.error('Failed to load applications.'))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Withdraw this application?')) return;
    setWithdrawingId(appId);
    try {
      await withdrawApplication(appId);
      setApplications(prev => prev.filter(a => a._id !== appId));
      toast.success('Application withdrawn.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw.');
    } finally { setWithdrawingId(null); }
  };

  // PRD v2 FR-APP-04 — stats per status
  const stats = {
    total:       applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview:   applications.filter(a => a.status === 'interview').length,
    offered:     applications.filter(a => a.status === 'offered').length,
  };

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  // Only allow withdraw for 'applied' status (first state)
  const canWithdraw = (status) => status === 'applied';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back 👋</p>
          <h1 className="font-display font-extrabold text-3xl text-white">{user?.firstName} {user?.lastName}</h1>
          <p className="text-indigo-200 mt-1 text-sm">Track every application in one place.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-5 pb-12">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Target}      label="Total Applied"  value={stats.total}       color="text-indigo-600"  bg="bg-indigo-50" />
          <StatCard icon={Star}        label="Shortlisted"    value={stats.shortlisted} color="text-violet-600"  bg="bg-violet-50" />
          <StatCard icon={Calendar}    label="Interviews"     value={stats.interview}   color="text-amber-600"   bg="bg-amber-50" />
          <StatCard icon={CheckCircle} label="Offers"         value={stats.offered}     color="text-emerald-600" bg="bg-emerald-50" />
        </div>

        {/* Applications table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-900 text-lg">My Applications</h2>
              <Link to="/jobs" className="btn-primary text-xs px-3 py-1.5">
                <Search className="w-3 h-3" /> Browse Jobs
              </Link>
            </div>
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {f}
                  {f !== 'all' && applications.filter(a => a.status === f).length > 0 && (
                    <span className="ml-1.5 bg-white/20 px-1 rounded-sm">
                      {applications.filter(a => a.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-14">
              <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-indigo-200 border-t-indigo-600" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-bold text-slate-900 text-base">
                No {filter !== 'all' ? `"${filter}"` : ''} applications yet
              </p>
              {filter === 'all' && (
                <p className="text-sm text-slate-500 mt-1.5">
                  <Link to="/jobs" className="text-indigo-600 font-semibold hover:underline">Browse jobs</Link> and start applying!
                </p>
              )}
            </div>
          )}

          {!loading && filtered.map((app, i) => {
            const jobTitle = app.jobId?.title || 'Job removed';
            const company  = app.jobId?.company?.name || '—';
            const jobId    = app.jobId?._id;

            return (
              <div key={app._id}
                className={`px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors ${
                  i < filtered.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                  {company.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {jobId ? (
                    <Link to={`/jobs/${jobId}`}
                      className="font-semibold text-slate-900 hover:text-indigo-700 transition-colors text-sm truncate block">
                      {jobTitle}
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-500 text-sm truncate">{jobTitle}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {company} · {formatDistanceToNow(new Date(app.appliedAt || app.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <StatusBadge status={app.status} />

                {/* PRD v2 FR-APP-05 — only allow withdraw if status is 'applied' */}
                {canWithdraw(app.status) && (
                  <button onClick={() => handleWithdraw(app._id)}
                    disabled={withdrawingId === app._id}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1 shrink-0"
                    title="Withdraw application">
                    {withdrawingId === app._id
                      ? <span className="block w-4 h-4 animate-spin rounded-full border-2 border-rose-300 border-t-rose-500" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeekerDashboard;
