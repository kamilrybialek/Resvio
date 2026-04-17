import React from 'react';
import { Job } from '../../lib/types';
import JobActions from './JobActions';

/** Sources that rely on Playwright browser automation (local/NAS only). */
const DEV_SOURCES = new Set(['LinkedIn', 'Indeed']);

interface JobCardProps {
  job: Job;
  isApplied?: boolean;
  onToggleApplied: (jobId: string) => void;
  isScoring?: boolean;
  onOpenDrawer?: (job: Job) => void;
}

function MatchRing({ score, scoring }: { score?: number; scoring: boolean }) {
  const s = score ?? 0;
  const color = s >= 75 ? 'var(--match-high)' : s >= 50 ? 'var(--match-mid)' : 'var(--match-low)';
  const bg   = s >= 75 ? 'var(--match-high-bg)' : s >= 50 ? 'var(--match-mid-bg)' : 'var(--match-low-bg)';

  // SVG ring: circumference of r=16 circle ≈ 100.5
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (s / 100) * circ;

  if (scoring) {
    return (
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'var(--bg-overlay)',
        border: '2px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        animation: 'pulse 1.4s ease-in-out infinite',
      }}>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', fontWeight: '600', letterSpacing: '0.02em' }}>···</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
      <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border-default)" strokeWidth="3" />
        {/* Progress */}
        <circle
          cx="26" cy="26" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s var(--ease-out)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: bg, borderRadius: '50%',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color, lineHeight: 1 }}>{s}<span style={{ fontSize: '0.5rem' }}>%</span></span>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    LinkedIn:           { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    Indeed:             { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    JobTech:            { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    Arbetsförmedlingen: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    'The Hub':          { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
    Adzuna:             { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    Jooble:             { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
    Reed:               { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
    NoFluffJobs:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    Finn:               { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
    JustJoinIT:         { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    RocketJobs:         { color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
  };
  const style = map[source] ?? { color: 'var(--text-secondary)', bg: 'var(--bg-overlay)' };
  const isDev = DEV_SOURCES.has(source);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '0.6rem', fontWeight: '700', padding: '2px 7px',
      borderRadius: 'var(--r-full)',
      color: style.color, background: style.bg,
      border: `1px solid ${style.color}30`,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {source}
      {isDev && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '2px',
          fontSize: '0.55rem', fontWeight: '800',
          color: '#f59e0b', background: 'rgba(245,158,11,0.15)',
          padding: '1px 4px', borderRadius: 'var(--r-full)',
          border: '1px solid rgba(245,158,11,0.3)',
          letterSpacing: '0.06em',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          DEV
        </span>
      )}
    </span>
  );
}

export default function JobCard({ job, isApplied = false, onToggleApplied, isScoring = false, onOpenDrawer }: JobCardProps) {
  return (
    <article
      className="card-hover"
      onClick={() => onOpenDrawer?.(job)}
      style={{ cursor: onOpenDrawer ? 'pointer' : 'default',
        background: 'var(--bg-elevated)',
        border: isApplied ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border-default)',
        borderRadius: 'var(--r-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: isApplied ? 0.65 : 1,
        transition: 'opacity 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Left accent line on hover (handled via CSS class) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px',
        background: isApplied
          ? 'rgba(16,185,129,0.6)'
          : 'var(--gradient-primary)',
        borderRadius: 'var(--r-lg) 0 0 var(--r-lg)',
        opacity: isApplied ? 1 : 0,
      }} className="card-accent-bar" />

      {/* Applied badge */}
      {isApplied && (
        <div style={{
          position: 'absolute', top: '-1px', right: '16px',
          background: 'rgba(16,185,129,0.9)',
          color: '#fff',
          padding: '3px 10px',
          borderRadius: '0 0 var(--r-md) var(--r-md)',
          fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.06em',
        }}>
          APPLIED ✓
        </div>
      )}

      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Logo */}
        <div style={{
          width: '42px', height: '42px', borderRadius: 'var(--r-md)',
          background: job.logo ? '#fff' : 'var(--bg-overlay)',
          border: '1px solid var(--border-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {job.logo
            ? <img src={job.logo} alt={job.company} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            : <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-light)', letterSpacing: '-0.02em' }}>
                {job.company.slice(0, 1).toUpperCase()}
              </span>
          }
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 'var(--text-md)', fontWeight: '700',
            color: 'var(--text-primary)', lineHeight: '1.3',
            marginBottom: '3px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {job.title}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{job.company}</span>
            <span style={{ color: 'var(--border-bright)' }}>·</span>
            <span>{job.location}</span>
          </p>
        </div>

        {/* Match score ring */}
        <MatchRing score={job.matchScore} scoring={isScoring} />
      </div>

      {/* ── Description ── */}
      <p style={{
        fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
        lineHeight: '1.6',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {job.description}
      </p>

      {/* ── Tags ── */}
      {job.tags && job.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {job.tags.slice(0, 5).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '8px',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <SourceBadge source={job.source} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{job.postedAt}</span>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <JobActions job={job} isApplied={isApplied} onToggleApplied={onToggleApplied} />
        </div>
      </div>
    </article>
  );
}
