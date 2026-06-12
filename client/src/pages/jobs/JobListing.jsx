// src/pages/jobs/JobListing.jsx
/**
 * JobListing — displays paginated job cards with a left-side filter panel.
 * All filter state lives in the URL (via useJobs hook) so it's shareable.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import useJobs from '../../hooks/useJobs';
import { formatDistanceToNow } from 'date-fns';

// ── Small sub-components ──────────────────────────────────────────────────────

const JobCard = ({ job }) => (
  <Link
    to={`/jobs/${job._id}`}
    className="card hover:shadow-md hover:border-blue-200 transition-all block group"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 truncate">
          {job.title}
        </h3>
        <p className="text-sm text-gray-600 mt-0.5">{job.company?.name || 'Company'}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
          )}
          {job.type && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {job.type}
            </span>
          )}
          {job.createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      {job.salary?.min && (
        <div className="text-right shrink-0">
          <span className="text-sm font-semibold text-green-600">
            ₹{(job.salary.min / 100000).toFixed(1)}–{(job.salary.max / 100000).toFixed(1)} LPA
          </span>
        </div>
      )}
    </div>
    <div className="flex flex-wrap gap-2 mt-3">
      {job.skills?.slice(0, 4).map((skill) => (
        <span key={skill} className="badge bg-blue-50 text-blue-700">
          {skill}
        </span>
      ))}
    </div>
  </Link>
);

const FilterPanel = ({ filters, updateFilter, clearFilters }) => (
  <aside className="w-full lg:w-64 shrink-0 space-y-5">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <X className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="label">Location</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Bangalore"
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
        />
      </div>

      {/* Job type */}
      <div className="mb-4">
        <label className="label">Job type</label>
        <select
          className="input-field"
          value={filters.type}
          onChange={(e) => updateFilter('type', e.target.value)}
        >
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      {/* Min salary */}
      <div>
        <label className="label">Min salary (₹ per year)</label>
        <input
          type="number"
          className="input-field"
          placeholder="e.g. 500000"
          value={filters.salary}
          onChange={(e) => updateFilter('salary', e.target.value)}
        />
      </div>
    </div>
  </aside>
);

// ── Main component ────────────────────────────────────────────────────────────
const JobListing = () => {
  const { jobs, loading, error, filters, pagination, updateFilter, setPage, clearFilters } = useJobs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input-field pl-9 max-w-lg"
              placeholder="Search jobs, skills, companies…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <FilterPanel filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} />

        {/* Results */}
        <main className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-4">
            {pagination.totalJobs} job{pagination.totalJobs !== 1 ? 's' : ''} found
          </p>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="card text-center text-red-600 text-sm">{error}</div>
          )}

          {/* Job cards */}
          {!loading && !error && jobs.length === 0 && (
            <div className="card text-center text-gray-500">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>No jobs found. Try adjusting your filters.</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default JobListing;
