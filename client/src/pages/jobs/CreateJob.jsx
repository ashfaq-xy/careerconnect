// src/pages/jobs/CreateJob.jsx
/**
 * CreateJob — full job creation form (recruiter only).
 *
 * Fields:
 *  - title, description, location, type (full-time/part-time/remote/contract/internship)
 *  - salary min/max, currency
 *  - skills (tag input — press Enter or comma to add)
 *  - application deadline
 *  - openings count
 *  - experience required
 *
 * On success → redirects to /dashboard (RecruiterDashboard).
 *
 * This component is also REUSED by EditJob.jsx via the `initialData` + `jobId` props.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Briefcase, MapPin, Clock, DollarSign, Tag, Calendar,
  Users, Star, X, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { createJob, updateJob } from '../../api/jobs.api';

// ── Job type options ──────────────────────────────────────────────────────────
const JOB_TYPES = [
  { value: 'full-time',   label: 'Full-Time' },
  { value: 'part-time',   label: 'Part-Time' },
  { value: 'remote',      label: 'Remote' },
  { value: 'contract',    label: 'Contract' },
  { value: 'internship',  label: 'Internship' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry',   label: 'Entry Level (0–2 yrs)' },
  { value: 'mid',     label: 'Mid Level (2–5 yrs)' },
  { value: 'senior',  label: 'Senior Level (5+ yrs)' },
  { value: 'lead',    label: 'Lead / Manager' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

/**
 * CreateJob form component.
 *
 * Props (only provided by EditJob):
 *  - initialData: object   — pre-filled job data for editing
 *  - jobId: string         — if set, calls updateJob instead of createJob
 */
const CreateJob = ({ initialData = null, jobId = null }) => {
  const navigate   = useNavigate();
  const isEdit     = Boolean(jobId);

  // ── Skills tag state ──────────────────────────────────────────────────────
  const [skills,       setSkills]       = useState(initialData?.skills || []);
  const [skillInput,   setSkillInput]   = useState('');

  // ── React Hook Form ───────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title:           initialData?.title           || '',
      description:     initialData?.description     || '',
      location:        initialData?.location        || '',
      type:            initialData?.type            || 'full-time',
      salaryMin:       initialData?.salary?.min     || '',
      salaryMax:       initialData?.salary?.max     || '',
      currency:        initialData?.salary?.currency || 'INR',
      deadline:        initialData?.deadline
        ? new Date(initialData.deadline).toISOString().split('T')[0]
        : '',
      openings:        initialData?.openings        || 1,
      experienceLevel: initialData?.experienceLevel || 'entry',
    },
  });

  // ── Skill tag input handlers ──────────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (skills.length === 0) {
      toast.error('Please add at least one skill.');
      return;
    }

    const payload = {
      title:           data.title,
      description:     data.description,
      location:        data.location,
      type:            data.type,
      salary: {
        min:      Number(data.salaryMin) || 0,
        max:      Number(data.salaryMax) || 0,
        currency: data.currency,
      },
      skills,
      deadline:        data.deadline || undefined,
      openings:        Number(data.openings) || 1,
      experienceLevel: data.experienceLevel,
    };

    try {
      if (isEdit) {
        await updateJob(jobId, payload);
        toast.success('Job updated successfully!');
      } else {
        await createJob(payload);
        toast.success('Job posted successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job. Please try again.');
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit
              ? 'Update the details for this job posting.'
              : 'Fill in the details below to attract the right candidates.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* ── Section 1: Basic Info ─────────────────────────────── */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Basic Information
            </h2>
            <div className="space-y-4">

              {/* Title */}
              <div>
                <label className="label">Job Title *</label>
                <input
                  type="text"
                  className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Senior React Developer"
                  {...register('title', {
                    required: 'Job title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                  })}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="label">Job Description *</label>
                <textarea
                  rows={6}
                  className={`input-field resize-y ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting…"
                  {...register('description', {
                    required: 'Description is required',
                    minLength: { value: 50, message: 'Please write at least 50 characters' },
                  })}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Location + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Location *
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                    placeholder="e.g., Mumbai, India"
                    {...register('location', { required: 'Location is required' })}
                  />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Job Type *
                    </span>
                  </label>
                  <select className="input-field" {...register('type', { required: true })}>
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Compensation ───────────────────────────── */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Salary Range
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Currency</label>
                <select className="input-field" {...register('currency')}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Min Salary (per year)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g., 500000"
                  {...register('salaryMin', { min: { value: 0, message: 'Min salary must be positive' } })}
                />
                {errors.salaryMin && (
                  <p className="mt-1 text-xs text-red-600">{errors.salaryMin.message}</p>
                )}
              </div>
              <div>
                <label className="label">Max Salary (per year)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g., 1200000"
                  {...register('salaryMax', { min: { value: 0, message: 'Max salary must be positive' } })}
                />
                {errors.salaryMax && (
                  <p className="mt-1 text-xs text-red-600">{errors.salaryMax.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Leave blank to show "Salary not disclosed".</p>
          </div>

          {/* ── Section 3: Skills ─────────────────────────────────── */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Required Skills *
            </h2>

            {/* Skill input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="input-field"
                placeholder="Type a skill and press Enter (e.g., React, Node.js)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn-secondary px-3 shrink-0"
              >
                Add
              </button>
            </div>

            {/* Skill tags */}
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {skills.length === 0 && (
                <p className="text-sm text-gray-400">No skills added yet.</p>
              )}
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="badge bg-blue-100 text-blue-700 gap-1 pl-2.5 pr-1.5 py-1"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ── Section 4: Other details ──────────────────────────── */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              Additional Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Deadline */}
              <div>
                <label className="label">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Application Deadline
                  </span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('deadline')}
                />
              </div>

              {/* Openings */}
              <div>
                <label className="label">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> No. of Openings
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  {...register('openings', {
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                />
                {errors.openings && (
                  <p className="mt-1 text-xs text-red-600">{errors.openings.message}</p>
                )}
              </div>

              {/* Experience level */}
              <div>
                <label className="label">Experience Level</label>
                <select className="input-field" {...register('experienceLevel')}>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Action buttons ────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {isEdit ? 'Updating…' : 'Posting…'}
                </>
              ) : (
                <>
                  {isEdit ? 'Update Job' : 'Post Job'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
