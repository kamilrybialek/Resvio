'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import JobCard from './components/JobCard';
import SearchHeader from './components/SearchHeader';
import { Job } from '@/lib/types';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({ q: '', l: '', d: 'any' });
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scoringJobs, setScoringJobs] = useState(false);

  const fetchBatchScores = useCallback(async (jobsToScore: Job[]) => {
    if (jobsToScore.length === 0) return;
    setScoringJobs(true);
    try {
      const res = await fetch('/api/batch-match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsToScore }),
      });
      const data = await res.json();
      const scores: Record<string, number> = data.scores || {};
      if (Object.keys(scores).length > 0) {
        setJobs(prev => prev.map(j => scores[j.id] !== undefined ? { ...j, matchScore: scores[j.id] } : j));
      }
    } catch {
      /* silent — keep existing scores */
    } finally {
      setScoringJobs(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      if (p?.name) setUserName(p.name.split(' ')[0]);
      if (p?.appliedJobs) setAppliedJobs(p.appliedJobs);
    }).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q: string, l: string, d: string = 'any') => {
    if (!q && !l) return;
    setIsLoading(true);
    setHasSearched(true);
    setJobs([]);
    setPage(1);
    setSearchParams({ q, l, d });
    setCanLoadMore(true);
    setSidebarOpen(false);

    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&p=1&d=${d}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      setJobs(results);
      if (results.length < 10) setCanLoadMore(false);
      fetchBatchScores(results);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchBatchScores]);

  const loadMore = async () => {
    if (isLoading || !canLoadMore) return;
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const { q, l, d } = searchParams;
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&p=${nextPage}&d=${d}`);
      const data = await res.json();
      const newJobs = Array.isArray(data) ? data : [];
      if (newJobs.length === 0) {
        setCanLoadMore(false);
      } else {
        setJobs(prev => [...prev, ...newJobs]);
        setPage(nextPage);
        if (newJobs.length < 5) setCanLoadMore(false);
        fetchBatchScores(newJobs);
      }
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApplied = useCallback((jobId: string) => {
    setAppliedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }, []);

  return (
    <>
      <style>{`
        .home-layout { display: flex; min-height: 100vh; }
        .home-main { margin-left: 280px; padding: 2rem 3rem; width: 100%; display: flex; flex-direction: column; gap: 1.75rem; }
        .home-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .mobile-menu-btn { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 200; padding: 0.5rem 0.75rem; border-radius: 8px; background: var(--glass); border: 1px solid var(--glass-border); color: var(--snow); cursor: pointer; font-size: 1.1rem; backdrop-filter: blur(12px); }
        .sidebar-overlay { display: none; }

        @media (max-width: 900px) {
          .home-main { margin-left: 0 !important; padding: 1.25rem 1rem 4rem !important; }
          .home-header-row h2 { font-size: 1.6rem !important; }
          .jobs-grid { grid-template-columns: 1fr !important; }
          .mobile-menu-btn { display: block !important; }
          .sidebar-overlay { display: block !important; }
          .home-sidebar {
            transform: translateX(-100%) !important;
            transition: transform 0.25s ease;
            z-index: 150 !important;
          }
          .home-sidebar.open {
            transform: translateX(0) !important;
          }
        }

        @media (max-width: 500px) {
          .home-main { padding: 1rem 0.75rem 4rem !important; }
        }
      `}</style>

      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140 }}
        />
      )}

      <div className="home-layout">
        {/* Sidebar with mobile class */}
        <div className={`home-sidebar${sidebarOpen ? ' open' : ''}`} style={{ position: 'fixed', zIndex: 150 }}>
          <Sidebar />
        </div>

        <main className="home-main">
          {/* Header */}
          <header className="home-header-row">
            <div style={{ paddingLeft: '0' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                Welcome back, <span className="premium-gradient">{userName || 'User'}</span>
              </h2>
              <p style={{ color: 'var(--glacier)', fontSize: '0.95rem' }}>
                {!hasSearched
                  ? 'Enter keywords and location to start finding opportunities.'
                  : isLoading
                  ? 'Searching across job boards…'
                  : jobs.length > 0
                  ? `Found ${jobs.length} opportunities · ${appliedJobs.length} applied`
                  : 'No results. Try different keywords or broaden the time filter.'}
              </p>
            </div>
            <a
              href="/profile"
              className="glass card-hover"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', color: 'var(--snow)', borderRadius: '10px', whiteSpace: 'nowrap' }}
            >
              Edit CV
            </a>
          </header>

          <SearchHeader onSearch={handleSearch} />

          {/* Results */}
          <section>
            {/* Empty states */}
            {!isLoading && !hasSearched && (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
                <p style={{ fontSize: '1rem', color: 'var(--glacier)' }}>Enter a job title and location above to start searching.</p>
              </div>
            )}
            {!isLoading && hasSearched && jobs.length === 0 && (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
                <p style={{ fontSize: '1rem', color: 'var(--glacier)' }}>No jobs found. Try different keywords, location, or time range.</p>
              </div>
            )}

            {/* Skeleton loader */}
            {isLoading && jobs.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '14px', opacity: 0.45 }}>
                    <div style={{ background: 'var(--glass-border)', height: '1rem', borderRadius: '8px', width: '45%', marginBottom: '0.7rem' }} />
                    <div style={{ background: 'var(--glass-border)', height: '0.7rem', borderRadius: '8px', width: '65%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Job results */}
            {jobs.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Opportunities</h3>
                  <div style={{ color: 'var(--glacier)', fontSize: '0.8rem', display: 'flex', gap: '0.75rem' }}>
                    <span>Page <strong>{page}</strong></span>
                    {appliedJobs.length > 0 && (
                      <span style={{ color: '#34d399' }}>{appliedJobs.length} applied</span>
                    )}
                  </div>
                </div>

                <div className="jobs-grid">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isApplied={appliedJobs.includes(job.id)}
                      onToggleApplied={handleToggleApplied}
                      isScoring={scoringJobs}
                    />
                  ))}
                </div>

                {canLoadMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="glass card-hover"
                      style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--snow)', fontWeight: '700', border: '1px solid var(--glass-border)', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                    >
                      {isLoading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
