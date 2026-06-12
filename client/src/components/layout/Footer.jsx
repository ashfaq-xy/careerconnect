// src/components/layout/Footer.jsx
/**
 * Footer — simple site footer with links and branding.
 *
 * Sections:
 *  - Brand tagline
 *  - Quick links: Jobs, About, Contact
 *  - Legal: Privacy Policy, Terms of Service
 *  - Copyright line
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* ── Brand column ─────────────────────────────────────── */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">CareerConnect</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Connecting talented professionals with the companies that need them.
              Find your next opportunity or hire top talent — all in one place.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-4">
              {[
                { icon: Github,   href: '#', label: 'GitHub' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Twitter,  href: '#', label: 'Twitter' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── For Job Seekers ──────────────────────────────────── */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              For Seekers
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/jobs',            label: 'Browse Jobs' },
                { to: '/register',        label: 'Create Account' },
                { to: '/my-applications', label: 'My Applications' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── For Recruiters ───────────────────────────────────── */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              For Recruiters
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/jobs/create', label: 'Post a Job' },
                { to: '/dashboard',   label: 'Recruiter Dashboard' },
                { to: '/register',    label: 'Sign Up Free' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ────────────────────────────────────────── */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {year} CareerConnect. MCA Final Project — All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
