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
    setAnalysis(null);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job })
      });
      const data = await response.json();
      
      if (data.error) {
        setAnalysis("Failed to analyze job match: " + data.error);
      } else {
        setAnalysis(`Match Score: ${data.score}% - ${data.reasoning} Tip: ${data.tailoringTips}`);
      }
    } catch (e) {
      setAnalysis("Error communicating with AI service.");
    } finally {
      setIsAnalyzing(false);
    }
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
      if (data.error) {
        alert(data.error);
      } else if (data.action === 'redirect') {
        window.open(data.url, '_blank');
        // Small delay to allow the user to see the alert or state change
        // State updates could also go here
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Error starting application process.');
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
