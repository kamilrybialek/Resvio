'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import JobCard from './components/JobCard';
import JobDrawer from './components/JobDrawer';
import SearchHeader, { SearchFilters } from './components/SearchHeader';
import { Job } from '@/lib/types';
import { MarketId, getMarket, DEFAULT_MARKET_ID } from '@/lib/markets';

type SortOption = 'match_desc' | 'match_asc' | 'date_desc' | 'date_asc' | 'title_asc' | 'company_asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'match_desc',  label: 'Best match' },
  { value: 'match_asc',   label: 'Worst match' },
  { value: 'date_desc',   label: 'Newest first' },
  { value: 'date_asc',    label: 'Oldest first' },
  { value: 'title_asc',   label: 'Title A→Z' },
  { value: 'company_asc', label: 'Company A→Z' },
];

function sortJobs(jobs: Job[], sortBy: SortOption): Job[] {
  return [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'match_desc':  return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      case 'match_asc':   return (a.matchScore ?? 0) - (b.matchScore ?? 0);
      case 'date_desc':   return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      case 'date_asc':    return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
      case 'title_asc':   return a.title.localeCompare(b.title);
      case 'company_asc': return a.company.localeCompare(b.company);
      default:            return 0;
    }
  });
}

export default function Home() {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [userName, setUserName]       = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage]               = useState(1);
  const [searchParams, setSearchParams] = useState({ q: '', l: '', d: 'any' });
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scoringJobs, setScoringJobs] = useState(false);
  const [sortBy, setSortBy]           = useState<SortOption>('match_desc');
  const [drawerJob, setDrawerJob]     = useState<Job | null>(null);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({ workType: 'any', jobType: 'any', experienceLevel: 'any' });
  const [statFilter, setStatFilter]   = useState<'strong' | 'applied' | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [market, setMarket]           = useState<MarketId>(DEFAULT_MARKET_ID);

  const sortedJobs = useMemo(() => {
    let filtered = jobs;
    if (activeFilters.workType !== 'any') {
      const wt = activeFilters.workType.toLowerCase();
      filtered = filtered.filter(j => {
        const text = (j.title + ' ' + j.description + ' ' + j.location).toLowerCase();
        if (wt === 'remote') return text.includes('remote') || text.includes('distans');
        if (wt === 'hybrid') return text.includes('hybrid');
        if (wt === 'onsite') return !text.includes('remote') && !text.includes('hybrid') && !text.includes('distans');
        return true;
      });
    }
    if (activeFilters.jobType !== 'any') {
      const jt = activeFilters.jobType.toLowerCase();
      filtered = filtered.filter(j => {
        const text = (j.title + ' ' + j.description).toLowerCase();
        if (jt === 'full-time') return !text.includes('part-time') && !text.includes('deltid') && !text.includes('intern');
        if (jt === 'part-time') return text.includes('part-time') || text.includes('deltid') || text.includes('parttime');
        if (jt === 'contract') return text.includes('contract') || text.includes('konsult') || text.includes('freelance');
        if (jt === 'internship') return text.includes('intern') || text.includes('trainee') || text.includes('praktik');
        return true;
      });
    }
    if (activeFilters.experienceLevel !== 'any') {
      const el = activeFilters.experienceLevel;
      filtered = filtered.filter(j => {
        const text = (j.title + ' ' + j.description).toLowerCase();
        if (el === 'junior') return text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('trainee');
        if (el === 'mid') return text.includes('mid') || text.includes('intermediate') || (j.matchScore !== undefined && j.matchScore >= 40);
        if (el === 'senior') return text.includes('senior') || text.includes('experienced') || text.includes('erfaren');
        if (el === 'lead') return text.includes('lead') || text.includes('principal') || text.includes('manager') || text.includes('head of');
        return true;
      });
    }
    return sortJobs(filtered, sortBy);
  }, [jobs, sortBy, activeFilters]);

  const highMatchCount = sortedJobs.filter(j => (j.matchScore ?? 0) >= 75).length;

  const availableSources = useMemo(() => {
    const s = new Set(jobs.map(j => j.source));
    return Array.from(s).sort();
  }, [jobs]);

  const displayedJobs = useMemo(() => {
    let result = sortedJobs;
    if (statFilter === 'strong') result = result.filter(j => (j.matchScore ?? 0) >= 75);
    if (statFilter === 'applied') result = result.filter(j => appliedJobs.includes(j.id));
    if (sourceFilter.length > 0) result = result.filter(j => sourceFilter.includes(j.source));
    return result;
  }, [sortedJobs, statFilter, appliedJobs, sourceFilter]);

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
    } catch { /* silent */ }
    finally { setScoringJobs(false); }
  }, []);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      if (p?.name) setUserName(p.name.split(' ')[0]);
      if (p?.appliedJobs) setAppliedJobs(p.appliedJobs);
    }).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q: string, l: string, d: string = 'any', filters?: SearchFilters) => {
    if (filters) setActiveFilters(filters);
    if (!q && !l) return;
    setIsLoading(true);
    setHasSearched(true);
    setJobs([]);
    setPage(1);
    setStatFilter(null);
    setSourceFilter([]);
    setSearchParams({ q, l, d });
    setCanLoadMore(true);
    setSidebarOpen(false);
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&p=1&d=${d}&m=${market}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : [];
      setJobs(results);
      if (results.length < 10) setCanLoadMore(false);
      fetchBatchScores(results);
    } catch { setJobs([]); }
    finally { setIsLoading(false); }
  }, [fetchBatchScores, market]);

  const loadMore = async () => {
    if (isLoading || !canLoadMore) return;
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const { q, l, d } = searchParams;
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}&p=${nextPage}&d=${d}&m=${market}`);
      const data = await res.json();
      const newJobs = Array.isArray(data) ? data : [];
      if (newJobs.length === 0) { setCanLoadMore(false); }
      else {
        setJobs(prev => [...prev, ...newJobs]);
        setPage(nextPage);
        if (newJobs.length < 5) setCanLoadMore(false);
        fetchBatchScores(newJobs);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const handleToggleApplied = useCallback((jobId: string) => {
    setAppliedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
  }, []);

  // Greeting based on time
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .home-layout { display: flex; min-height: 100vh; }
        .home-main   { margin-left: var(--sidebar-width); min-height: 100vh; display: flex; flex-direction: column; width: 100%; }

        /* ── Mobile ── */
        .mobile-bar { display: none; }
        .sidebar-overlay { display: none; }
        @media (max-width: 900px) {
          .home-layout { overflow-x: hidden; }
          .home-main   { margin-left: 0 !important; min-width: 0; overflow-x: hidden; }
          .mobile-bar  { display: flex !important; }
          .sidebar-overlay { display: block !important; }
          .home-sidebar { transform: translateX(-100%); transition: transform 0.28s var(--ease-out); }
          .home-sidebar.open { transform: translateX(0); }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .jobs-grid { grid-template-columns: 1fr !important; }
          .page-header { padding: 20px 16px 24px !important; }
          .results-area { padding: 20px 16px 48px !important; }
        }
        @media (max-width: 560px) {
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .page-header-top { flex-direction: column !important; gap: 10px !important; margin-bottom: 20px !important; }
          .page-header-top h1 { font-size: var(--text-2xl) !important; }
          .search-wrap-card { padding: 16px !important; border-radius: var(--r-lg) !important; }
        }

        /* ── Sort select ── */
        .sort-select {
          padding: 6px 12px; border-radius: var(--r-full);
          background: var(--bg-elevated); color: var(--text-secondary);
          border: 1px solid var(--border-default);
          font-size: var(--text-xs); font-family: var(--font-sans);
          cursor: pointer; outline: none;
          transition: border-color var(--duration-fast) ease;
        }
        .sort-select:focus { border-color: var(--border-accent); }
        .sort-select option { background: var(--bg-elevated); }

        /* ── Stat card ── */
        .stat-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-dim);
          border-radius: var(--r-lg);
          padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
        }
        .stat-icon {
          width: 40px; height: 40px; border-radius: var(--r-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Jobs grid ── */
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr)); gap: 12px; }

        /* ── Card accent on hover ── */
        .card-hover:hover .card-accent-bar { opacity: 1 !important; }

        /* ── Skeleton ── */
        @keyframes skeletonPulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* ── Mobile top bar ── */}
      <div className="mobile-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-dim)',
        alignItems: 'center',
        padding: '0 16px', gap: '12px',
        backdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            width: '36px', height: '36px', borderRadius: 'var(--r-md)',
            background: sidebarOpen ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sidebarOpen ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
        <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>
          Apply<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>arr</span>
        </span>
      </div>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 140, backdropFilter: 'blur(4px)' }} />
      )}

      <div className="home-layout">

        {/* ── Sidebar ── */}
        <div className={`home-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 150, height: '100vh' }}>
          <Sidebar market={market} onMarketChange={(id) => { setMarket(id); setSidebarOpen(false); }} />
        </div>

        {/* ── Main content ── */}
        <main className="home-main" style={{ paddingTop: 0 }}>

          {/* ── Page header ── */}
          <div className="page-header" style={{
            padding: '40px 40px 32px',
            background: `linear-gradient(180deg, var(--bg-surface) 0%, transparent 100%)`,
            borderBottom: '1px solid var(--border-dim)',
          }}>
            {/* Mobile spacer */}
            <div className="mobile-bar" style={{ height: '56px', display: 'none' }} />

            <div className="page-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '6px', fontWeight: '500' }}>
                  {greeting} ✦
                </p>
                <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                  {userName ? (
                    <>{userName}, <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>find your next role</span></>
                  ) : (
                    <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Find your next role</span>
                  )}
                </h1>
              </div>
              <a href="/profile" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '9px 18px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-full)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: '600',
                textDecoration: 'none',
                transition: 'all var(--duration-fast) ease',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Edit Profile
              </a>
            </div>

            {/* ── Stats row ── */}
            {hasSearched && (
              <>
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px', animation: 'fadeInUp 0.4s var(--ease-out)' }}>
                {/* All jobs */}
                <button
                  onClick={() => setStatFilter(null)}
                  className="stat-card"
                  style={{ cursor: 'pointer', border: statFilter === null ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)', background: statFilter === null ? 'var(--accent-dim)' : 'var(--bg-elevated)', transition: 'all var(--duration-fast) ease', textAlign: 'left' }}
                >
                  <div className="stat-icon" style={{ background: 'var(--accent-dim)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: statFilter === null ? 'var(--accent-light)' : 'var(--text-primary)', lineHeight: 1 }}>{jobs.length}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>Jobs found</p>
                  </div>
                </button>

                {/* Strong matches */}
                <button
                  onClick={() => setStatFilter(f => f === 'strong' ? null : 'strong')}
                  className="stat-card"
                  style={{ cursor: 'pointer', border: statFilter === 'strong' ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-dim)', background: statFilter === 'strong' ? 'rgba(16,185,129,0.08)' : 'var(--bg-elevated)', transition: 'all var(--duration-fast) ease', textAlign: 'left' }}
                >
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--match-high)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: statFilter === 'strong' ? 'var(--match-high)' : 'var(--text-primary)', lineHeight: 1 }}>{highMatchCount}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>Strong matches</p>
                  </div>
                </button>

                {/* Applied */}
                <button
                  onClick={() => setStatFilter(f => f === 'applied' ? null : 'applied')}
                  className="stat-card"
                  style={{ cursor: 'pointer', border: statFilter === 'applied' ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--border-dim)', background: statFilter === 'applied' ? 'rgba(251,191,36,0.08)' : 'var(--bg-elevated)', transition: 'all var(--duration-fast) ease', textAlign: 'left' }}
                >
                  <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: statFilter === 'applied' ? 'var(--text-warning)' : 'var(--text-primary)', lineHeight: 1 }}>{appliedJobs.length}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>Applied</p>
                  </div>
                </button>
              </div>

              {/* ── Source filters ── */}
              {availableSources.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', animation: 'fadeInUp 0.4s var(--ease-out) 0.1s both' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: '600', flexShrink: 0 }}>Source:</span>
                  {availableSources.map(src => {
                    const active = sourceFilter.includes(src);
                    return (
                      <button
                        key={src}
                        onClick={() => setSourceFilter(prev => active ? prev.filter(s => s !== src) : [...prev, src])}
                        style={{
                          padding: '3px 12px', borderRadius: 'var(--r-full)',
                          border: active ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
                          background: active ? 'var(--accent-dim)' : 'transparent',
                          color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                          fontSize: 'var(--text-xs)', fontWeight: active ? '700' : '500',
                          cursor: 'pointer', transition: 'all var(--duration-fast) ease',
                        }}
                      >
                        {src}
                      </button>
                    );
                  })}
                  {sourceFilter.length > 0 && (
                    <button onClick={() => setSourceFilter([])} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                      Clear
                    </button>
                  )}
                </div>
              )}
              </>
            )}

            {/* ── Search ── */}
            <div className="search-wrap-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-xl)', padding: '24px' }}>
              <SearchHeader onSearch={handleSearch} market={market} />
            </div>
          </div>

          {/* ── Results area ── */}
          <div className="results-area" style={{ padding: '28px 40px 60px', flex: 1 }}>

            {/* Empty states */}
            {!isLoading && !hasSearched && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: 'var(--r-xl)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: 'var(--text-primary)' }}>Ready to search</h2>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: '1.6' }}>
                  Enter a job title and location above. We'll search LinkedIn, Indeed, JobTech, and more simultaneously.
                </p>
              </div>
            )}

            {!isLoading && hasSearched && jobs.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔍</div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '800' }}>No results found</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: '1.6' }}>
                  Try broader keywords, different location, or extend the time range.
                </p>
              </div>
            )}

            {/* Skeleton loading */}
            {isLoading && jobs.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 'var(--r-lg)',
                    padding: '20px',
                    animation: 'skeletonPulse 1.5s ease infinite',
                    animationDelay: `${i * 0.12}s`,
                  }}>
                    <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                      <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: 'var(--r-md)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: '14px', width: '55%', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ height: '11px', width: '38%' }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ height: '10px', width: '90%', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ height: '10px', width: '75%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {jobs.length > 0 && (
              <>
                {/* Toolbar */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '12px', marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      Opportunities
                    </h2>
                    <span style={{
                      background: 'var(--bg-overlay)', border: '1px solid var(--border-dim)',
                      borderRadius: 'var(--r-full)', padding: '2px 10px',
                      fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600',
                    }}>
                      {displayedJobs.length}
                    </span>
                    {(statFilter || sourceFilter.length > 0) && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        (filtered from {sortedJobs.length})
                      </span>
                    )}
                    {scoringJobs && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                        Scoring matches…
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Sort:</span>
                    <select
                      className="sort-select"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortOption)}
                    >
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Grid */}
                <div className="jobs-grid">
                  {displayedJobs.map((job, i) => (
                    <div key={job.id} style={{ animation: `fadeInUp 0.3s var(--ease-out) ${Math.min(i, 6) * 0.04}s both` }}>
                      <JobCard
                        job={job}
                        isApplied={appliedJobs.includes(job.id)}
                        onToggleApplied={handleToggleApplied}
                        isScoring={scoringJobs}
                        onOpenDrawer={setDrawerJob}
                      />
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {canLoadMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '28px' }}>
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      style={{
                        padding: '12px 36px',
                        borderRadius: 'var(--r-full)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                        fontWeight: '600', fontSize: 'var(--text-sm)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'all var(--duration-base) ease',
                      }}
                    >
                      {isLoading ? 'Loading…' : 'Load more results'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Job detail drawer ── */}
      <JobDrawer
        job={drawerJob}
        isApplied={drawerJob ? appliedJobs.includes(drawerJob.id) : false}
        onToggleApplied={handleToggleApplied}
        onClose={() => setDrawerJob(null)}
      />

      {/* ── Mobile spacer for top bar ── */}
      <style>{`
        @media (max-width: 900px) {
          .home-main { padding-top: 56px !important; }
          .home-main > div:first-child { padding: 24px 16px 20px !important; }
          .home-main > div:last-child  { padding: 20px 16px 80px !important; }
        }
      `}</style>
    </>
  );
}
