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
        body: JSON.stringify({
          jobId: job.id, jobUrl: job.url, jobTitle: job.title,
          company: job.company, location: job.location, source: job.source,
          toggle: true, currentlyApplied: isApplied,
        }),
      });
      onToggleApplied(job.id);
    } catch {
      onToggleApplied(job.id);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={handleToggleApplied}
        disabled={loading}
        className={isApplied ? 'btn btn-success' : 'btn btn-ghost'}
        style={{ padding: '6px 14px', fontSize: 'var(--text-xs)', borderRadius: 'var(--r-full)' }}
      >
        {isApplied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Applied
          </>
        ) : 'Mark applied'}
      </button>

      <button
        onClick={openApplyPage}
        className="btn btn-primary"
        style={{ padding: '6px 16px', fontSize: 'var(--text-xs)' }}
      >
        Tailor CV
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
