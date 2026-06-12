// src/components/layout/Layout.jsx
/**
 * Layout — the main page shell.
 *
 * Renders: Navbar → <Outlet /> (page content) → Footer
 *
 * Used as a wrapper route in App.jsx so every page automatically
 * gets the navigation and footer without repeating them.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    {/* Top navigation — sticky, always visible */}
    <Navbar />

    {/* Page content — grows to fill remaining height */}
    <main className="flex-1">
      <Outlet />
    </main>

    {/* Site footer */}
    <Footer />
  </div>
);

export default Layout;
