'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';

interface JobActionsProps {
  job: Job;
}

export default function JobActions({ job }: JobActionsProps) {
  const openApplyPage = () => {
    // Store job in sessionStorage so the new tab can read it
    sessionStorage.setItem('applyJob', JSON.stringify(job));
    // Mark as applied immediately
    fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, jobUrl: job.url, jobTitle: job.title }),
    });
    window.open('/apply', '_blank');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
      <button
        onClick={openApplyPage}
        style={{
          padding: '8px 20px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.875rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Apply Now ✦
      </button>
    </div>
  );
}
