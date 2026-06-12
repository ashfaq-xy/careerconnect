// src/api/jobs.api.js
/**
 * Jobs-related API calls.
 * Maps to: GET/POST/PUT/DELETE /jobs
 */

import api from './axios';

/**
 * Fetch paginated + filtered job listings (public endpoint).
 *
 * Note: The server uses 'keyword' (not 'search') for text search,
 * 'jobType' (not 'type') for job type, and 'salaryMin'/'salaryMax' for salary.
 * This function maps the client-friendly names to what the server expects.
 *
 * @param {object} params - { search, location, type, salaryMin, salaryMax, page, limit }
 */
export const getJobs = ({ search, type, ...rest } = {}) =>
  api.get('/jobs', {
    params: {
      ...(search && { keyword: search }),   // map 'search' → 'keyword'
      ...(type && { jobType: type }),        // map 'type' → 'jobType'
      ...rest,
    },
  });

/**
 * Fetch a single job by ID (public endpoint).
 * @param {string} id
 */
export const getJobById = (id) => api.get(`/jobs/${id}`);

/**
 * Create a new job (recruiter only).
 * @param {object} jobData
 */
export const createJob = (jobData) => api.post('/jobs', jobData);

/**
 * Update an existing job (recruiter/admin).
 * @param {string} id
 * @param {object} updates
 */
export const updateJob = (id, updates) => api.put(`/jobs/${id}`, updates);

/**
 * Delete a job (recruiter/admin).
 * @param {string} id
 */
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

/**
 * Get jobs posted by the currently logged-in recruiter.
 */
export const getMyJobs = () => api.get('/jobs/my-jobs');

/**
 * Toggle a job's active/inactive status (recruiter only).
 * @param {string} id
 */
export const toggleJobStatus = (id) => api.patch(`/jobs/${id}/status`);
