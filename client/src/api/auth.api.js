// src/api/auth.api.js
/**
 * Auth-related API calls.
 * Maps to: POST /auth/register, /auth/login, /auth/logout,
 *           /auth/verify-email, /auth/forgot-password, /auth/reset-password/:token
 */

import api from './axios';

/**
 * Register a new user.
 * @param {{ firstName, lastName, email, password, role }} data
 */
export const registerUser = (data) => api.post('/auth/register', data);

/**
 * Login with email and password.
 * Returns { accessToken, user } on success.
 * @param {{ email, password }} credentials
 */
export const loginUser = (credentials) => api.post('/auth/login', credentials);

/**
 * Logout — invalidates the refresh token cookie on the server.
 */
export const logoutUser = () => api.post('/auth/logout');

/**
 * Verify email with OTP sent after registration.
 * @param {{ otp: string }} payload
 */
export const verifyEmail = (payload) => api.post('/auth/verify-email', payload);

/**
 * Trigger a password reset email.
 * @param {{ email: string }} payload
 */
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload);

/**
 * Reset password using the token from the reset email.
 * @param {string} token - URL token from the reset email
 * @param {{ password: string }} payload
 */
export const resetPassword = (token, payload) =>
  api.post(`/auth/reset-password/${token}`, payload);
