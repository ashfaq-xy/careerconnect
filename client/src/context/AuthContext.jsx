// src/context/AuthContext.jsx
/**
 * AuthContext — manages authentication state across the app.
 *
 * Responsibilities:
 *  - Stores current user object and access token in memory
 *  - Exposes login(), logout(), register() actions
 *  - On app mount, attempts a silent token refresh so page reloads don't log users out
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { loginUser, logoutUser, registerUser } from '../api/auth.api';
import { setAccessToken, clearAccessToken } from '../api/axios';
import axios from 'axios';

// ── Context creation ──────────────────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * Custom hook — must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while attempting silent refresh on mount

  // ── Silent token refresh on app startup ──────────────────────────────────
  useEffect(() => {
    
    const silentRefresh = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid session — stay logged out; this is normal on first visit
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    silentRefresh();
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await registerUser(formData);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await loginUser(credentials);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if server call fails, clear local state
    } finally {
      clearAccessToken();
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(user);
  const isRecruiter     = user?.role === 'recruiter';
  const isAdmin         = user?.role === 'admin';
  const isJobSeeker     = user?.role === 'jobseeker';

  const value = {
    user,
    loading,
    isAuthenticated,
    isRecruiter,
    isAdmin,
    isJobSeeker,
    login,
    logout,
    register,
    setUser,         // allow profile update without full re-login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
