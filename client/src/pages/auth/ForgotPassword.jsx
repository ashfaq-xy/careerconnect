// src/pages/auth/ForgotPassword.jsx
/**
 * ForgotPassword — page to request a password reset email.
 *
 * The user enters their email address. If an account exists,
 * the server sends a reset link. We always show a success message
 * to prevent email enumeration attacks.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle, Briefcase } from 'lucide-react';
import { forgotPassword } from '../../api/auth.api';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [email,     setEmail]     = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data);
      setEmail(data.email);
      setSubmitted(true);
    } catch (err) {
      // Still show success to prevent email enumeration
      setEmail(data.email);
      setSubmitted(true);
    }
  };

  // ── Success state (email sent) ────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CareerConnect</h1>
          </div>

          <div className="card shadow-xl text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-1">
              If <span className="font-medium text-gray-700">{email}</span> is registered,
              we've sent a password reset link.
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Don't forget to check your spam folder.
            </p>

            <Link to="/login" className="btn-primary w-full justify-center">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CareerConnect</h1>
          <p className="text-gray-500 mt-1">Reset your password</p>
        </div>

        <div className="card shadow-xl">
          {/* Icon + heading */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Forgot your password?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Sending…
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>

          {/* Back link */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 mt-5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
