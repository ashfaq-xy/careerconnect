// src/api/application.api.js
/**
 * Application-related API calls.
 * Maps to: /applications endpoints
 */

import api from './axios';

/**
 * Apply to a job (job seeker only).
 * @param {string} jobId
 * @param {object} payload - { coverLetter?, resumeUrl? }
 */
export const applyToJob = (jobId, payload = {}) =>
  api.post(`/applications/apply/${jobId}`, payload);

/**
 * Get all applications submitted by the logged-in job seeker.
 */
export const getMyApplications = () => api.get('/applications/my-applications');

/**
 * Get all applications for a specific job (recruiter only).
 * @param {string} jobId
 */
export const getApplicationsByJob = (jobId) =>
  api.get(`/applications/job/${jobId}`);

/**
 * Update the status of an application (recruiter only).
 * @param {string} appId
 * @param {{ status: string }} payload - status: 'reviewing'|'shortlisted'|'rejected'|'hired'
 */
export const updateApplicationStatus = (appId, payload) =>
  api.patch(`/applications/${appId}/status`, payload);

/**
 * Withdraw an application (job seeker only).
 * @param {string} appId
 */
export const withdrawApplication = (appId) =>
  api.delete(`/applications/${appId}`);
