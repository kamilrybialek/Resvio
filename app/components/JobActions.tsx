'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';

interface JobActionsProps {
  job: Job;
}

export default function JobActions({ job }: JobActionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulate AI call
    setTimeout(() => {
      setAnalysis("This job is a strong match (92%). Emphasize your Swedish design aesthetics and Figma workflow.");
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleApply = async () => {
    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobUrl: job.url,
          jobTitle: job.title
        })
      });
      const data = await response.json();
      if (data.error) alert(data.error);
      else alert(data.message);
    } catch (e) {
      alert('Error starting automation.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {analysis && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--glass-border)', 
          borderRadius: '8px', 
          fontSize: '0.85rem',
          color: 'var(--nordic-teal)',
          borderLeft: '4px solid var(--nordic-teal)'
        }}>
          <strong>AI Insight:</strong> {analysis}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            color: 'var(--snow)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            opacity: isAnalyzing ? 0.5 : 1
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
        <button 
          onClick={handleApply}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '8px', 
            background: 'var(--nordic-blue)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}
