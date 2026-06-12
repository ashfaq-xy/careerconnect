// src/api/axios.js
/**
 * Central Axios instance for CareerConnect.
 *
 * Features:
 *  - Base URL from env variable VITE_API_URL
 *  - Attaches Authorization: Bearer <token> header on every request
 *  - On 401 response, tries a silent token refresh via /auth/refresh-token
 *  - Queues concurrent requests during a refresh to avoid multiple refresh calls
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ── Create instance ───────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,      // Send httpOnly cookie (refreshToken)
  headers: { 'Content-Type': 'application/json' },
});

// ── Token helpers (store access token in memory — safer than localStorage) ───
let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => { accessToken = null; };

// ── Request interceptor: attach Bearer token ──────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 with silent refresh ─────────────────────
let isRefreshing = false;
let failedQueue = [];   // Holds { resolve, reject } for requests waiting on refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh (cookie carries the refresh token)
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
