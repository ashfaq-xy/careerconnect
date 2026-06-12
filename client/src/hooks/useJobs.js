// src/hooks/useJobs.js
/**
 * useJobs — fetches job listings with filter, search, and pagination.
 *
 * Reads filter state from URL search params so filters survive page refresh
 * and can be shared as a link.
 *
 * Usage:
 *   const { jobs, loading, error, pagination, setPage } = useJobs();
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getJobs } from '../api/jobs.api';

const useJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({
    currentPage:  1,
    totalPages:   1,
    totalJobs:    0,
    limit:        10,
  });

  // ── Derive filter values from URL params ──────────────────────────────────
  const filters = {
    search:    searchParams.get('search')    || '',
    location:  searchParams.get('location')  || '',
    type:      searchParams.get('type')      || '',     // full-time, part-time, contract, remote
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || '',
    page:      parseInt(searchParams.get('page') || '1', 10),
    limit:     10,
  };

  // ── Fetch jobs whenever URL params change ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await getJobs(filters);
        if (!cancelled) {
          setJobs(data.jobs || []);
          setPagination({
            currentPage: data.currentPage || 1,
            totalPages:  data.pages       || 1,    // server returns 'pages' not 'totalPages'
            totalJobs:   data.total       || 0,
            limit:       filters.limit,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load jobs. Please try again.');
          setJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => { cancelled = true; };
  }, [searchParams.toString()]); // re-run when ANY param changes

  // ── Helpers to update filters/page ───────────────────────────────────────
  const updateFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1'); // reset to first page on filter change
      return next;
    });
  }, [setSearchParams]);

  const setPage = useCallback((page) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return {
    jobs,
    loading,
    error,
    filters,
    pagination,
    updateFilter,
    setPage,
    clearFilters,
  };
};

export default useJobs;
