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

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      if (p?.name) setUserName(p.name.split(' ')[0]);
      if (p?.appliedJobs) setAppliedJobs(p.appliedJobs);
    }).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q: string, l: string) => {
    if (!q && !l) return;
    setIsLoading(true);
    setHasSearched(true);
    setJobs([]);
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main style={{
        marginLeft: '320px',
        padding: '2rem 4rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.4rem' }}>
              Welcome back, <span className="premium-gradient">{userName || 'User'}</span>
            </h2>
            <p style={{ color: 'var(--glacier)', fontSize: '1rem' }}>
              {!hasSearched
                ? 'Enter keywords and location to start finding tailored opportunities.'
                : isLoading
                ? 'Searching across job boards…'
                : jobs.length > 0
                ? `We curated ${jobs.length} tailored opportunities for you.`
                : 'No positions found. Try adjusting your search.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="/profile" className="glass card-hover" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none', color: 'var(--snow)', borderRadius: '10px' }}>
              Edit Base CV
            </a>
          </div>
        </header>

        <SearchHeader onSearch={handleSearch} />

        <section style={{ marginTop: '0.5rem' }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass" style={{ padding: '2rem', borderRadius: '16px', opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
                  <div style={{ background: 'var(--glass-border)', height: '1rem', borderRadius: '8px', width: '40%', marginBottom: '0.8rem' }} />
                  <div style={{ background: 'var(--glass-border)', height: '0.7rem', borderRadius: '8px', width: '70%' }} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && hasSearched && jobs.length === 0 && (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--glacier)' }}>No jobs found. Try a different keyword or location.</p>
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--glacier)' }}>🔍 Start by entering a job title and location above.</p>
            </div>
          )}

          {jobs.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Recommended for you</h3>
                <div style={{ color: 'var(--glacier)', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                  <span>Source: <strong>All</strong></span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} isApplied={appliedJobs.includes(job.id)} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
