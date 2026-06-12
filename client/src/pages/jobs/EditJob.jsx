// src/pages/jobs/EditJob.jsx
/**
 * EditJob — pre-filled edit form for a job posting.
 *
 * Fetches the existing job data by ID from the URL param,
 * then renders the CreateJob form component with initialData + jobId props.
 *
 * Route: /jobs/:id/edit  (recruiter/admin only)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getJobById } from '../../api/jobs.api';
import CreateJob from './CreateJob';

const EditJob = () => {
  const { id }  = useParams();      // job ID from URL
  const navigate = useNavigate();

  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── Fetch existing job data on mount ─────────────────────────────────────
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await getJobById(id);
        setJob(data.job);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load job. It may have been deleted.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-gray-700 font-medium">{error || 'Job not found.'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── Render CreateJob with pre-filled data ─────────────────────────────────
  return <CreateJob initialData={job} jobId={id} />;
};

export default EditJob;
