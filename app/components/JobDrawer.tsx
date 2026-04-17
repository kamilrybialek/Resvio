'use client';

import React, { useEffect, useState } from 'react';
import { Job } from '@/lib/types';
import JobActions from './JobActions';

interface JobDrawerProps {
  job: Job | null;
  isApplied: boolean;
  onToggleApplied: (jobId: string) => void;
  onClose: () => void;
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    LinkedIn:           { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    Indeed:             { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    JobTech:            { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    Arbetsförmedlingen: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    'The Hub':          { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    JustJoinIT:         { color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
    RocketJobs:         { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  };
  const s = map[source] ?? { color: 'var(--text-secondary)', bg: 'var(--bg-overlay)' };
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: '700', padding: '3px 9px',
      borderRadius: 'var(--r-full)',
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}30`,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>{source}</span>
  );
}

export default function JobDrawer({ job, isApplied, onToggleApplied, onClose }: JobDrawerProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [clLoading, setClLoading] = useState(false);
  const [clError, setClError] = useState('');
  const [showCL, setShowCL] = useState(false);

  // Reset cover letter when job changes
  useEffect(() => {
    setCoverLetter('');
    setClError('');
    setShowCL(false);
  }, [job?.id]);

  async function generateCoverLetter() {
    if (!job) return;
    setClLoading(true);
    setClError('');
    setShowCL(true);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (data.error) { setClError(data.error); }
      else { setCoverLetter(data.letter || ''); }
    } catch {
      setClError('Failed to generate. Please try again.');
    } finally {
      setClLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (job) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [job]);

  if (!job) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(560px, 100vw)',
        zIndex: 310,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-dim)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.28s var(--ease-out)',
        overflowY: 'auto',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Drawer header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-dim)',
          padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SourceBadge source={job.source} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{job.postedAt}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: 'var(--r-md)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-tertiary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Job identity */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--border-dim)',
          background: `linear-gradient(180deg, var(--bg-elevated) 0%, transparent 100%)`,
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: 'var(--r-md)',
              background: job.logo ? '#fff' : 'var(--bg-overlay)',
              border: '1px solid var(--border-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {job.logo
                ? <img src={job.logo} alt={job.company} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                : <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-light)' }}>{job.company?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '6px' }}>
                {job.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{job.company}</span>
                <span style={{ color: 'var(--border-bright)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>{job.location}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {job.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <JobActions job={job} isApplied={isApplied} onToggleApplied={onToggleApplied} />
            {job.url && (
              <a
                href={job.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '6px 14px', borderRadius: 'var(--r-full)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)', fontSize: 'var(--text-xs)',
                  fontWeight: '600', textDecoration: 'none',
                  transition: 'all var(--duration-fast) ease',
                }}
              >
                View on {job.source}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
            {/* Generate cover letter */}
            <button
              onClick={generateCoverLetter}
              disabled={clLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px', borderRadius: 'var(--r-full)',
                border: '1px solid var(--border-accent)',
                background: showCL ? 'var(--accent-dim)' : 'transparent',
                color: 'var(--accent-light)', fontSize: 'var(--text-xs)',
                fontWeight: '600', cursor: clLoading ? 'wait' : 'pointer',
                transition: 'all var(--duration-fast) ease',
                opacity: clLoading ? 0.7 : 1,
              }}
            >
              {clLoading ? (
                <>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--accent-light)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Generating…
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Cover Letter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full description */}
        <div style={{ padding: '24px', flex: 1 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
            Job Description
          </p>
          {job.description ? (
            <div style={{
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              lineHeight: '1.75', whiteSpace: 'pre-wrap',
            }}>
              {job.description}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
              No description available. View the original posting for details.
            </p>
          )}
        </div>

        {/* Cover Letter panel */}
        {showCL && (
          <div style={{
            margin: '0 16px 24px',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border-accent)',
            background: 'var(--bg-elevated)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s var(--ease-out)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-dim)',
              background: 'var(--accent-dim)',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-light)' }}>
                Cover Letter
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {coverLetter && (
                  <>
                  <button
                    onClick={() => { navigator.clipboard.writeText(coverLetter); }}
                    title="Copy to clipboard"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: 'var(--r-full)',
                      border: '1px solid var(--border-accent)',
                      background: 'transparent', color: 'var(--accent-light)',
                      fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('applyJob', JSON.stringify(job));
                      sessionStorage.setItem('coverLetterText', coverLetter);
                      window.open('/cover-letter', '_blank');
                    }}
                    title="Open in editor for PDF"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: 'var(--r-full)',
                      border: '1px solid var(--border-accent)',
                      background: 'transparent', color: 'var(--accent-light)',
                      fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    PDF
                  </button>
                  </>
                )}
                <button
                  onClick={() => generateCoverLetter()}
                  disabled={clLoading}
                  title="Regenerate"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: 'var(--r-full)',
                    border: '1px solid var(--border-accent)',
                    background: 'transparent', color: 'var(--accent-light)',
                    fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer',
                    opacity: clLoading ? 0.5 : 1,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
                  </svg>
                  Regenerate
                </button>
                <button
                  onClick={() => setShowCL(false)}
                  style={{
                    width: '22px', height: '22px', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--border-dim)', background: 'transparent',
                    color: 'var(--text-tertiary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              {clLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                  Writing cover letter…
                </div>
              )}
              {clError && (
                <p style={{ color: 'var(--text-warning)', fontSize: 'var(--text-sm)' }}>{clError}</p>
              )}
              {coverLetter && !clLoading && (
                <div style={{
                  fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                  lineHeight: '1.8', whiteSpace: 'pre-wrap',
                }}>
                  {coverLetter}
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
