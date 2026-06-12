// src/pages/auth/Register.jsx
/**
 * Register page — first name, last name, email, password, role selection.
 * After registration the server sends an OTP email; user is redirected to verify-email.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Eye, EyeOff, UserCheck, Search } from 'lucide-react';

const ROLES = [
  {
    id: 'jobseeker',
    label: 'Job Seeker',
    description: 'Find and apply for jobs',
    Icon: Search,
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    description: 'Post jobs and hire talent',
    Icon: UserCheck,
  },
];

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'jobseeker' } });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('Account created! Please check your email for the OTP.');
      navigate('/verify-email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join CareerConnect</h1>
          <p className="text-gray-500 mt-1">Create your free account in seconds</p>
        </div>

        <div className="card shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Role selector */}
            <div>
              <p className="label">I am a…</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ id, label, description, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setValue('role', id)}
                    className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedRole === id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${selectedRole === id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-semibold ${selectedRole === id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{description}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('role', { required: true })} />
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First name</label>
                <input
                  id="firstName"
                  type="text"
                  className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Ravi"
                  {...register('firstName', { required: 'Required' })}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Kumar"
                  {...register('lastName', { required: 'Required' })}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min. 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-2.5" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
