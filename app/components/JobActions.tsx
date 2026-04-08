'use client';

import React, { useState } from 'react';
import { Job } from '@/lib/types';

interface JobActionsProps {
  job: Job;
}

export default function JobActions({ job }: JobActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [analysis, setAnalysis] = useState<{ score: number; reasoning: string; tailoringTips: string } | null>(null);
  const [tailoredCv, setTailoredCv] = useState<string | null>(null);
  const [marked, setMarked] = useState(false);

  const openModal = () => {
    setShowModal(true);
    // Auto-trigger analysis when opening
    handleAnalyze();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const data = await response.json();
      if (!data.error) {
        setAnalysis({ score: data.score, reasoning: data.reasoning, tailoringTips: data.tailoringTips });
      }
    } catch (e) {
      // silently fail — analysis is optional
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCv = async () => {
    setIsGeneratingCv(true);
    setTailoredCv(null);
    try {
      const response = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const data = await response.json();
      if (data.error) {
        setTailoredCv('Error: ' + data.error);
      } else {
        setTailoredCv(data.tailoredCv);
      }
    } catch (e) {
      setTailoredCv('Error: Could not connect to AI service.');
    } finally {
      setIsGeneratingCv(false);
    }
  };

  const handleMarkApplied = async () => {
    await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobUrl: job.url, jobId: job.id, jobTitle: job.title }),
    });
    setMarked(true);
  };

  const handleCopyAndOpen = () => {
    if (tailoredCv) navigator.clipboard.writeText(tailoredCv);
    window.open(job.url, '_blank');
  };

  const scoreColor = analysis
    ? analysis.score >= 80
      ? 'var(--forest)'
      : analysis.score >= 60
      ? '#f0a500'
      : '#e05555'
    : 'var(--glacier)';

  return (
    <>
      {/* ── Trigger buttons ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={openModal}
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

      {/* ── Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'var(--slate)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '2rem',
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.3rem' }}>{job.title}</h2>
                <p style={{ color: 'var(--glacier)', fontSize: '0.9rem' }}>
                  {job.company} · {job.location} · <span style={{ color: 'var(--slater)' }}>{job.source}</span>
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--glacier)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.7rem',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'var(--glass-border)',
                      color: 'var(--snow)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1rem 1.2rem',
                fontSize: '0.875rem',
                color: 'var(--mist)',
                lineHeight: '1.7',
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid var(--glass-border)',
              }}
            >
              {job.description || 'No description available. Open the full listing to read more.'}
            </div>

            {/* AI Analysis */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1rem 1.2rem',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--glacier)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Match Analysis
                </span>
                {isAnalyzing && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--nordic-teal)', animation: 'pulse 1.5s infinite' }}>
                    Analyzing…
                  </span>
                )}
                {analysis && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '1.3rem',
                      fontWeight: '900',
                      color: scoreColor,
                    }}
                  >
                    {analysis.score}%
                  </span>
                )}
              </div>

              {analysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--mist)' }}>
                  <p>{analysis.reasoning}</p>
                  <p style={{ color: 'var(--nordic-teal)', fontStyle: 'italic' }}>💡 {analysis.tailoringTips}</p>
                </div>
              ) : !isAnalyzing ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--slater)' }}>Add your CV in Profile to see personalized analysis.</p>
              ) : null}
            </div>

            {/* Generate CV */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={handleGenerateCv}
                disabled={isGeneratingCv}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: isGeneratingCv ? 'var(--glass-border)' : 'linear-gradient(135deg, #1a3a4a, var(--nordic-teal))',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: isGeneratingCv ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isGeneratingCv ? '⏳ Generating Tailored CV…' : '✦ Generate Tailored CV with AI'}
              </button>

              {tailoredCv && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <textarea
                    readOnly
                    value={tailoredCv}
                    style={{
                      width: '100%',
                      minHeight: '280px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      padding: '1rem',
                      color: 'var(--snow)',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      lineHeight: '1.6',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(tailoredCv)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        color: 'var(--snow)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      📋 Copy CV
                    </button>
                    <button
                      onClick={handleCopyAndOpen}
                      style={{
                        flex: 2,
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'var(--nordic-blue)',
                        color: 'white',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Copy & Open Job Listing →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <button
                onClick={handleMarkApplied}
                disabled={marked}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${marked ? 'var(--forest)' : 'var(--glass-border)'}`,
                  background: marked ? 'rgba(0,180,100,0.1)' : 'transparent',
                  color: marked ? 'var(--forest)' : 'var(--glacier)',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: marked ? 'default' : 'pointer',
                }}
              >
                {marked ? '✓ Marked as Applied' : 'Mark as Applied'}
              </button>

              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--glacier)',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                Open Original ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
