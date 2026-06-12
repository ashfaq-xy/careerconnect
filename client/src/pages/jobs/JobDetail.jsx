// src/pages/jobs/JobDetail.jsx
/**
 * JobDetail — shows full job info and an "Apply Now" button for job seekers.
 * Recruiters see an "Edit" button instead.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Briefcase, Clock, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getJobById } from '../../api/jobs.api';
import { applyToJob } from '../../api/application.api';
import { useAuth } from '../../context/AuthContext';

const JobDetail = () => {
  const { id }                        = useParams();
  const navigate                      = useNavigate();
  const { isAuthenticated, isJobSeeker, isRecruiter } = useAuth();

  const [job,      setJob]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied,  setApplied]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── Fetch job ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await getJobById(id);
        setJob(data.job);
      } catch (err) {
        setError(err.response?.data?.message || 'Job not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // ── Apply handler ─────────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    setApplying(true);
    try {
      await applyToJob(id);
      setApplied(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || 'Job not found'}</p>
        <Link to="/jobs" className="btn-secondary">← Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Back */}
        <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1 font-medium">{job.company?.name}</p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
                  </span>
                )}
                {job.type && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-400" /> {job.type}
                  </span>
                )}
                {job.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.skills.map((skill) => (
                    <span key={skill} className="badge bg-blue-50 text-blue-700 px-3 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
              <div
                className="text-gray-700 text-sm leading-relaxed whitespace-pre-line"
              >
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card">
              {/* Salary */}
              {job.salary?.min && (
                <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
                  <DollarSign className="w-4 h-4" />
                  ₹{(job.salary.min / 100000).toFixed(1)} – {(job.salary.max / 100000).toFixed(1)} LPA
                </div>
              )}

              {/* CTA */}
              {isJobSeeker && (
                <button
                  onClick={handleApply}
                  disabled={applying || applied}
                  className="btn-primary w-full py-2.5"
                >
                  {applied ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Applied!
                    </span>
                  ) : applying ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Applying…
                    </span>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              )}

              {!isAuthenticated && (
                <Link to="/login" className="btn-primary w-full py-2.5 text-center block">
                  Sign in to Apply
                </Link>
              )}

              {isRecruiter && (
                <Link to={`/jobs/${job._id}/edit`} className="btn-secondary w-full py-2.5 text-center block">
                  Edit Job
                </Link>
              )}
            </div>

            {/* Job details summary */}
            <div className="card text-sm space-y-3">
              <h3 className="font-semibold text-gray-900">Job Details</h3>
              {job.experience && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience</span>
                  <span className="font-medium">{job.experience} yrs</span>
                </div>
              )}
              {job.openings && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Openings</span>
                  <span className="font-medium">{job.openings}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Apply by</span>
                  <span className="font-medium">
                    {new Date(job.deadline).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
