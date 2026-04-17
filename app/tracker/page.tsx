'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { TrackerEntry, TrackerStatus } from '@/lib/services/tracker-service';

const STATUS_COLS: { key: TrackerStatus; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  {
    key: 'applied', label: 'Applied', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
  {
    key: 'phone', label: 'Phone Screen', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z"/></svg>,
  },
  {
    key: 'interview', label: 'Interview', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: 'offer', label: 'Offer', color: '#10b981', bg: 'rgba(16,185,129,0.1)',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    key: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
];

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    LinkedIn: '#60a5fa', Indeed: '#fbbf24',
    Arbetsförmedlingen: '#34d399', 'The Hub': '#c084fc',
  };
  const color = map[source] ?? 'var(--text-tertiary)';
  return (
    <span style={{ fontSize: '0.6rem', fontWeight: '700', color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {source}
    </span>
  );
}

export default function TrackerPage() {
  const [entries, setEntries]       = useState<TrackerEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editNotes, setEditNotes]   = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/tracker').then(r => r.json()).then(data => {
      setEntries(Array.isArray(data) ? data : []);
    }).catch(() => setEntries([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: TrackerStatus) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', id, status }) });
  };

  const saveNotes = async (id: string) => {
    setSavingNotes(id);
    await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notes', id, notes: editNotes[id] ?? '' }) });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, notes: editNotes[id] ?? '' } : e));
    setSavingNotes(null);
    setEditNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Remove this application from tracker?')) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    await fetch('/api/tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
  };

  const byStatus = (status: TrackerStatus) => entries.filter(e => e.status === status);

  return (
    <>
      <style>{`
        .tracker-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--bg-base); }
        .tracker-columns { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; align-items: start; }
        .mobile-tracker-bar { display: none; }
        .tracker-sidebar-overlay { display: none; }

        @media (max-width: 1200px) {
          .tracker-columns { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .tracker-main { margin-left: 0 !important; padding-top: 56px !important; }
          .mobile-tracker-bar { display: flex !important; }
          .tracker-sidebar-overlay { display: block !important; }
          .tracker-sidebar { transform: translateX(-100%); transition: transform 0.28s var(--ease-out); }
          .tracker-sidebar.open { transform: translateX(0); }
          .tracker-columns { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .tracker-columns { grid-template-columns: 1fr !important; }
        }

        .tracker-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-dim);
          border-radius: var(--r-lg);
          padding: 14px;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color var(--duration-fast) ease;
          animation: fadeInUp 0.3s var(--ease-out) both;
        }
        .tracker-card:hover { border-color: var(--border-default); }

        .status-select {
          padding: 4px 8px; border-radius: var(--r-full);
          background: var(--bg-surface); color: var(--text-secondary);
          border: 1px solid var(--border-default);
          font-size: var(--text-xs); font-family: var(--font-sans);
          cursor: pointer; outline: none;
          transition: border-color var(--duration-fast) ease;
          width: 100%;
        }
        .status-select:focus { border-color: var(--border-accent); }
        .status-select option { background: var(--bg-elevated); }
      `}</style>

      {/* Mobile top bar */}
      <div className="mobile-tracker-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: '56px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-dim)',
        alignItems: 'center', padding: '0 16px', gap: '12px',
        backdropFilter: 'blur(16px)',
      }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', background: sidebarOpen ? 'var(--accent-dim)' : 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {sidebarOpen
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>
          Res<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vio</span>
        </span>
      </div>

      {sidebarOpen && (
        <div className="tracker-sidebar-overlay" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 140, backdropFilter: 'blur(4px)' }} />
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className={`tracker-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 150, height: '100vh' }}>
          <Sidebar />
        </div>

        <main className="tracker-main" style={{ flex: 1 }}>

          {/* Header */}
          <div style={{ padding: '40px 40px 28px', background: `linear-gradient(180deg, var(--bg-surface) 0%, transparent 100%)`, borderBottom: '1px solid var(--border-dim)' }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Application <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tracker</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              Track every application through the hiring pipeline.
            </p>

            {/* Summary stats */}
            {entries.length > 0 && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                {STATUS_COLS.map(col => (
                  <div key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: col.color }}>{col.icon}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{byStatus(col.key).length}</span> {col.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '28px 40px 60px' }}>

            {loading && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: '160px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {!loading && entries.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: '16px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: 'var(--r-xl)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: 'var(--text-primary)' }}>No applications yet</h2>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: '1.6' }}>
                  When you mark a job as applied on the search page, it will appear here automatically.
                </p>
                <a href="/" className="btn btn-primary" style={{ marginTop: '8px', padding: '10px 24px', textDecoration: 'none' }}>
                  Search Jobs
                </a>
              </div>
            )}

            {!loading && entries.length > 0 && (
              <div className="tracker-columns">
                {STATUS_COLS.map((col, ci) => (
                  <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px', animationDelay: `${ci * 0.04}s` }}>
                    {/* Column header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', background: col.bg, borderRadius: 'var(--r-md)', border: `1px solid ${col.color}25`, marginBottom: '4px' }}>
                      <span style={{ color: col.color }}>{col.icon}</span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: col.color }}>{col.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', fontWeight: '800', color: col.color, background: `${col.color}20`, padding: '1px 7px', borderRadius: 'var(--r-full)' }}>
                        {byStatus(col.key).length}
                      </span>
                    </div>

                    {/* Cards in this column */}
                    {byStatus(col.key).map((entry, ei) => (
                      <div key={entry.id} className="tracker-card" style={{ animationDelay: `${ei * 0.05}s` }}>
                        <div>
                          <p style={{ fontSize: 'var(--text-sm)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>{entry.jobTitle}</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '5px' }}>{entry.company}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <SourceBadge source={entry.source} />
                            {entry.location && <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{entry.location}</span>}
                          </div>
                        </div>

                        {/* Status selector */}
                        <select
                          className="status-select"
                          value={entry.status}
                          onChange={e => updateStatus(entry.id, e.target.value as TrackerStatus)}
                        >
                          {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>

                        {/* Notes */}
                        <div>
                          {editNotes[entry.id] !== undefined ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <textarea
                                value={editNotes[entry.id]}
                                onChange={e => setEditNotes(prev => ({ ...prev, [entry.id]: e.target.value }))}
                                placeholder="Notes…"
                                style={{
                                  width: '100%', minHeight: '70px', padding: '8px 10px',
                                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                                  borderRadius: 'var(--r-md)', color: 'var(--text-primary)',
                                  fontSize: 'var(--text-xs)', lineHeight: '1.5',
                                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                                  boxSizing: 'border-box',
                                }}
                              />
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => saveNotes(entry.id)} className="btn btn-primary" style={{ flex: 1, padding: '5px 10px', fontSize: '0.65rem', justifyContent: 'center' }}>
                                  {savingNotes === entry.id ? 'Saving…' : 'Save'}
                                </button>
                                <button onClick={() => setEditNotes(prev => { const n = { ...prev }; delete n[entry.id]; return n; })} className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditNotes(prev => ({ ...prev, [entry.id]: entry.notes || '' }))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', padding: 0, textAlign: 'left', width: '100%' }}
                            >
                              {entry.notes ? (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{entry.notes.slice(0, 60)}{entry.notes.length > 60 ? '…' : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--text-tertiary)' }}>+ Add notes</span>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Applied {entry.appliedAt}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {entry.url && (
                              <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', color: 'var(--text-tertiary)', transition: 'color var(--duration-fast) ease' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            )}
                            <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {byStatus(col.key).length === 0 && (
                      <div style={{ padding: '20px 12px', textAlign: 'center', border: '1px dashed var(--border-dim)', borderRadius: 'var(--r-lg)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                        Empty
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
