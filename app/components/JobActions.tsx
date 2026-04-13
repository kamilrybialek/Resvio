'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';

interface JobActionsProps {
  job: Job;
  isApplied: boolean;
  onToggleApplied: (jobId: string) => void;
}

export default function JobActions({ job, isApplied, onToggleApplied }: JobActionsProps) {
  const [loading, setLoading] = useState(false);

  const openApplyPage = () => {
    sessionStorage.setItem('applyJob', JSON.stringify(job));
    window.open('/apply', '_blank');
  };

  const handleToggleApplied = async () => {
    setLoading(true);
    try {
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, jobUrl: job.url, jobTitle: job.title, toggle: true, currentlyApplied: isApplied }),
      });
      onToggleApplied(job.id);
    } catch {
      onToggleApplied(job.id); // optimistic update even on error
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
      {/* Applied toggle */}
      <button
        onClick={handleToggleApplied}
        disabled={loading}
        title={isApplied ? 'Mark as not applied' : 'Mark as applied'}
        style={{
          padding: '7px 14px',
          borderRadius: '8px',
          background: isApplied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
          border: isApplied ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--glass-border)',
          color: isApplied ? '#34d399' : 'var(--glacier)',
          fontWeight: '600', fontSize: '0.8rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {isApplied ? '✓ Applied' : 'Mark applied'}
      </button>

      {/* Open apply page */}
      <button
        onClick={openApplyPage}
        style={{
          padding: '7px 18px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
          color: 'white', fontWeight: '600', fontSize: '0.875rem',
          border: 'none', cursor: 'pointer',
        }}
      >
        Apply Now ✦
      </button>
    </div>
  );
}
