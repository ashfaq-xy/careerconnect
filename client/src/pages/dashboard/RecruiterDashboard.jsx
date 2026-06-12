// src/pages/dashboard/RecruiterDashboard.jsx
// PRD v2 FR-APP-03/04 — recruiter sees applicants, updates statuses
// PRD v2 FR-APP-04 statuses: reviewing | shortlisted | interview | offered | rejected
// PRD v2 FR-JOB-05 — my jobs with applicationCount
// PRD v2 FR-JOB-06 — toggle job status open/closed

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Briefcase, Users, PlusCircle, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, User, TrendingUp, Edit3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMyJobs, toggleJobStatus } from '../../api/jobs.api';
import { getApplicationsByJob, updateApplicationStatus } from '../../api/application.api';
import { useAuth } from '../../context/AuthContext';

// PRD v2 FR-APP-04 — recruiter can set these statuses only
const RECRUITER_STATUSES = ['reviewing', 'shortlisted', 'interview', 'offered', 'rejected'];

const STATUS_COLORS = {
  applied:     'bg-slate-50 text-slate-600 border-slate-200',
  reviewing:   'bg-sky-50 text-sky-700 border-sky-200',
  shortlisted: 'bg-violet-50 text-violet-700 border-violet-200',
  interview:   'bg-amber-50 text-amber-700 border-amber-200',
  offered:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:    'bg-rose-50 text-rose-600 border-rose-200',
};

const ApplicantRow = ({ app, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const initials = `${app.applicantId?.firstName?.[0] || ''}${app.applicantId?.lastName?.[0] || ''}`.toUpperCase();

  const handleChange = async (e) => {
    setUpdating(true);
    try { await onStatusChange(app._id, e.target.value); }
    finally { setUpdating(false); }
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
        {initials || <User className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {app.applicantId?.firstName} {app.applicantId?.lastName}
        </p>
        <p className="text-xs text-slate-400 truncate">{app.applicantId?.email}</p>
      </div>

      {/* Current status badge */}
      <span className={`badge border text-[11px] font-semibold px-2.5 py-1 capitalize ${STATUS_COLORS[app.status] || STATUS_COLORS.applied}`}>
        {app.status}
      </span>

      {/* Status changer — PRD v2 FR-APP-04 */}
      <select value={app.status} onChange={handleChange} disabled={updating}
        className="text-xs border border-slate-200 bg-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 text-slate-700 capitalize">
        {/* Show current status (even if it's 'applied') as first option */}
        {!RECRUITER_STATUSES.includes(app.status) && (
          <option value={app.status} disabled className="capitalize">{app.status}</option>
        )}
        {RECRUITER_STATUSES.map(s => (
          <option key={s} value={s} className="capitalize">{s}</option>
        ))}
      </select>
    </div>
  );
};

const JobCard = ({ job, onToggleStatus }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [toggling,     setToggling]     = useState(false);

  const handleExpand = async () => {
    setExpanded(v => !v);
    if (!expanded && applications.length === 0) {
      setLoadingApps(true);
      try {
        const { data } = await getApplicationsByJob(job._id);
        setApplications(data.applications || []);
      } catch { toast.error('Failed to load applicants.'); }
      finally { setLoadingApps(false); }
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
      toast.success('Status updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleStatus(job._id); }
    finally { setToggling(false); }
  };

  const abbr  = job.company?.name ? job.company.name.slice(0, 2).toUpperCase() : job.title?.slice(0, 2).toUpperCase();
  const isOpen = job.status === 'open';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-indigo-200 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {abbr}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-[15px]">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{job.jobType} · {job.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                  isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {isOpen ? 'Active' : 'Closed'}
                </span>
                <Link to={`/jobs/${job._id}/edit`}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {job.applicationCount || 0} applicant{job.applicationCount !== 1 ? 's' : ''}
              </span>
              {job.createdAt && (
                <span className="text-xs text-slate-400">
                  Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <button onClick={handleExpand}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide applicants' : 'View applicants'}
          </button>
          <div className="flex-1" />
          {/* PRD v2 FR-JOB-06 — toggle status */}
          <button onClick={handleToggle} disabled={toggling}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
              isOpen
                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            }`}>
            {isOpen
              ? <><ToggleRight className="w-4 h-4 text-emerald-500" />{toggling ? 'Updating…' : 'Close job'}</>
              : <><ToggleLeft className="w-4 h-4" />{toggling ? 'Updating…' : 'Reopen'}</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          {loadingApps ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-indigo-200 border-t-indigo-600" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No applicants yet.</div>
          ) : (
            <div>
              <div className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> {applications.length} Applicant{applications.length !== 1 ? 's' : ''}
              </div>
              {applications.map(app => (
                <ApplicantRow key={app._id} app={app} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyJobs()
      .then(({ data }) => setJobs(data.jobs || []))
      .catch(() => toast.error('Failed to load jobs.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (jobId) => {
    try {
      const { data } = await toggleJobStatus(jobId);
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: data.status } : j));
      toast.success(`Job ${data.status === 'open' ? 'activated' : 'closed'}.`);
    } catch { toast.error('Failed to toggle job status.'); }
  };

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0);
  const activeJobs      = jobs.filter(j => j.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-violet-200 text-sm font-medium mb-1">Recruiter Dashboard</p>
          <h1 className="font-display font-extrabold text-3xl text-white">{user?.firstName}'s Jobs</h1>
          <p className="text-violet-200 mt-1 text-sm">Manage postings and review applicants.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-5 pb-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Briefcase,  label: 'Total Jobs',       value: jobs.length,     color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
            { icon: TrendingUp, label: 'Active Jobs',      value: activeJobs,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Users,      label: 'Total Applicants', value: totalApplicants, color: 'text-violet-600',  bg: 'bg-violet-50'  },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-display font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-slate-900 text-lg">Your Job Postings</h2>
          <Link to="/jobs/create" className="btn-primary text-sm">
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-14">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-14 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-bold text-slate-900 text-lg">No jobs posted yet</p>
            <p className="text-slate-500 text-sm mt-1.5">Post your first job to start receiving applications.</p>
            <Link to="/jobs/create" className="btn-primary mt-5">
              <PlusCircle className="w-4 h-4" /> Post Your First Job
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard key={job._id} job={job} onToggleStatus={handleToggleStatus} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
