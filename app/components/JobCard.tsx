import React from 'react';
import { Job } from '../../lib/types';
import JobActions from './JobActions';

interface JobCardProps {
  job: Job;
  isApplied?: boolean;
  onToggleApplied: (jobId: string) => void;
  isScoring?: boolean;
}

export default function JobCard({ job, isApplied = false, onToggleApplied, isScoring = false }: JobCardProps) {
  return (
    <div
      className={`glass card-hover ${isApplied ? 'applied-job' : ''}`}
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        opacity: isApplied ? 0.55 : 1,
        border: isApplied ? '1px solid rgba(52,211,153,0.25)' : '1px solid var(--glass-border)',
        position: 'relative',
        filter: isApplied ? 'grayscale(0.3)' : 'none',
        transition: 'opacity 0.2s, filter 0.2s',
      }}
    >
      {/* Applied badge */}
      {isApplied && (
        <div style={{
          position: 'absolute', top: '-9px', right: '14px',
          background: 'rgba(16,185,129,0.9)', color: 'white',
          padding: '2px 10px', borderRadius: '20px',
          fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.04em',
        }}>
          APPLIED ✓
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', minWidth: 0 }}>
          {job.logo && (
            <img src={job.logo} alt={job.company} style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fff', objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</h3>
            <p style={{ color: 'var(--glacier)', fontSize: '0.82rem' }}>{job.company} · {job.location}</p>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isScoring ? (
            <>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--glacier)', opacity: 0.5, animation: 'pulse 1.2s ease-in-out infinite' }}>···</div>
              <p style={{ fontSize: '0.65rem', color: 'var(--glacier)' }}>Analyzing</p>
            </>
          ) : (
            <>
              <div className="premium-gradient" style={{ fontSize: '1.15rem', fontWeight: '700' }}>{job.matchScore}%</div>
              <p style={{ fontSize: '0.65rem', color: 'var(--glacier)' }}>Match</p>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.85rem', color: 'var(--mist)', lineHeight: '1.55',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {job.description}
      </p>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {job.tags.slice(0, 6).map(tag => (
            <span key={tag} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--glass-border)', color: 'var(--snow)' }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--slater)' }}>
          {job.source} · {job.postedAt}
        </span>
        <JobActions job={job} isApplied={isApplied} onToggleApplied={onToggleApplied} />
      </div>
    </div>
  );
}
