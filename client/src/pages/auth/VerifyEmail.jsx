// src/pages/auth/VerifyEmail.jsx
/**
 * VerifyEmail — OTP verification page shown after registration.
 *
 * The server sends a 6-digit OTP to the user's email after sign-up.
 * This page lets the user enter that code to activate their account.
 *
 * Features:
 *  - 6 individual digit input boxes (auto-focus + auto-advance)
 *  - Paste support (pastes across all 6 boxes)
 *  - Resend OTP link (with 60s cooldown)
 *  - Redirects to /dashboard on success
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, CheckCircle, Briefcase } from 'lucide-react';
import { verifyEmail } from '../../api/auth.api';
import api from '../../api/axios';

const DIGIT_COUNT = 6;

const VerifyEmail = () => {
  const navigate = useNavigate();

  // Array of 6 digit values
  const [digits,    setDigits]    = useState(Array(DIGIT_COUNT).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown,  setCooldown]  = useState(0); // seconds left on resend cooldown
  const [success,   setSuccess]   = useState(false);

  // Refs for each input box
  const inputRefs = useRef([]);

  // ── Cooldown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── Focus first input on mount ────────────────────────────────────────────
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Handle single digit input ─────────────────────────────────────────────
  const handleChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto-advance to next box
    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Handle backspace ──────────────────────────────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle paste (spread across all boxes) ────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    // Focus the next empty box or the last box
    const focusIndex = Math.min(pasted.length, DIGIT_COUNT - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  // ── Submit OTP ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < DIGIT_COUNT) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ otp });
      setSuccess(true);
      toast.success('Email verified! Welcome aboard 🎉');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      // Clear the inputs on failure
      setDigits(Array(DIGIT_COUNT).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp');
      toast.success('A new OTP has been sent to your email.');
      setCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="card text-center max-w-sm w-full shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-500 text-sm">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CareerConnect</h1>
        </div>

        <div className="card shadow-xl">
          {/* Icon + heading */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter the 6-digit code sent to your email address.
            </p>
          </div>

          {/* OTP form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* 6 digit inputs */}
            <div className="flex gap-2 justify-center mb-6">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-colors ${digit ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                />
              ))}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-primary w-full py-2.5"
              disabled={loading || digits.join('').length < DIGIT_COUNT}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Verifying…
                </span>
              ) : 'Verify Email'}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className={`font-medium transition-colors ${
                  cooldown > 0 || resending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:underline'
                }`}
              >
                {resending ? (
                  <span className="flex items-center gap-1 inline-flex">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Sending…
                  </span>
                ) : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>

          {/* Back to login */}
          <p className="mt-4 text-center text-sm text-gray-400">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
