import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Briefcase, Clock, ArrowLeft, CheckCircle, Building2, Users, Award, Edit3, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getJobById } from '../../api/jobs.api';
import { applyToJob } from '../../api/application.api';
import { useAuth } from '../../context/AuthContext';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isJobSeeker, isRecruiter } = useAuth();

  const [job, setJob]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const [error, setError]       = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getJobById(id)
      .then(({ data }) => setJob(data.job))
      .catch(err => setError(err.response?.data?.message || 'Job not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    setApplying(true);
    try {
      await applyToJob(id, { coverLetter, resumeUrl: 'https://placeholder.com/resume' });
      setApplied(true);
      setShowForm(false);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600" />
    </div>
  );

  if (error || !job) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-bold text-slate-900">{error || 'Job not found'}</p>
      <Link to="/jobs" className="btn-secondary">← Back to listings</Link>
    </div>
  );

  const abbr = job.company?.name ? job.company.name.slice(0,2).toUpperCase() : '??';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5">
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0">
              {abbr}
            </div>
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-2xl text-slate-900">{job.title}</h1>
              <p className="text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {job.company?.name || 'Company'}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {job.location && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </span>
                )}
                {job.jobType && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 capitalize">
                    {job.jobType}
                  </span>
                )}
                {job.createdAt && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {job.skills?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-display font-bold text-slate-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-display font-bold text-slate-900 mb-4">Job Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-20">

              {/* Job meta */}
              <dl className="space-y-3 mb-6">
                {job.experience && (
                  <div className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-400">Experience</dt>
                      <dd className="text-sm font-semibold text-slate-900 capitalize">{job.experience}</dd>
                    </div>
                  </div>
                )}
                {job.openings && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <dt className="text-xs text-slate-400">Openings</dt>
                      <dd className="text-sm font-semibold text-slate-900">{job.openings}</dd>
                    </div>
                  </div>
                )}
              </dl>

              {/* Apply section */}
              {isJobSeeker && !applied && !showForm && (
                <button onClick={() => setShowForm(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all">
                  <Zap className="w-4 h-4" /> Apply Now
                </button>
              )}

              {isJobSeeker && showForm && !applied && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Cover Letter (optional)</label>
                    <textarea rows={4} className="input-field resize-none text-sm"
                      placeholder="Why are you a good fit for this role?"
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)} />
                  </div>
                  <button onClick={handleApply} disabled={applying}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {applying
                      ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Submitting…</>
                      : <><CheckCircle className="w-4 h-4" />Submit Application</>}
                  </button>
                  <button onClick={() => setShowForm(false)} className="w-full text-sm text-slate-500 hover:text-slate-700 py-1">
                    Cancel
                  </button>
                </div>
              )}

              {applied && (
                <div className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Applied Successfully!
                </div>
              )}

              {!isAuthenticated && (
                <Link to="/login" className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                  Sign in to Apply
                </Link>
              )}

              {isRecruiter && (
                <Link to={`/jobs/${job._id}/edit`} className="btn-secondary w-full py-3 justify-center text-sm font-bold">
                  <Edit3 className="w-4 h-4" /> Edit Job
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
