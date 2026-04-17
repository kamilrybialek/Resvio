'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';

const LANGUAGES = ['English','Swedish','Norwegian','Danish','German','Polish','French','Spanish','Dutch'];

export default function CoverLetterPage() {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [jobTitle, setJobTitle]             = useState('');
  const [company, setCompany]               = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [language, setLanguage]             = useState('English');
  const [letter, setLetter]                 = useState('');
  const [isGenerating, setIsGenerating]     = useState(false);
  const [error, setError]                   = useState('');
  const [copied, setCopied]                 = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  // Pre-fill from sessionStorage if coming from a job card
  useEffect(() => {
    const stored = sessionStorage.getItem('applyJob');
    if (stored) {
      try {
        const job = JSON.parse(stored);
        setJobTitle(job.title || '');
        setCompany(job.company || '');
        setJobDescription(job.description || '');
      } catch {}
    }
  }, []);

  const generate = async () => {
    if (!jobTitle && !jobDescription) {
      setError('Enter at least a job title or paste the job description.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setLetter('');
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: { title: jobTitle, company, description: jobDescription },
          jobDescription,
          targetLanguage: language,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setLetter(data.letter || '');
    } catch {
      setError('Failed to connect to AI service.');
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printLetter = () => window.print();

  return (
    <>
      <style>{`
        .cl-main { margin-left: var(--sidebar-width); min-height: 100vh; background: var(--bg-base); }
        .cl-mobile-bar { display: none; }
        .cl-sidebar-overlay { display: none; }
        .cl-sidebar { position: fixed; top: 0; left: 0; z-index: 150; height: 100vh; }
        @media (max-width: 900px) {
          .cl-main { margin-left: 0 !important; padding-top: 56px !important; }
          .cl-mobile-bar { display: flex !important; position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 56px; background: var(--bg-surface); border-bottom: 1px solid var(--border-dim); align-items: center; padding: 0 16px; gap: 12px; backdrop-filter: blur(16px); }
          .cl-sidebar-overlay { display: block !important; }
          .cl-sidebar { transform: translateX(-100%); transition: transform 0.28s var(--ease-out); }
          .cl-sidebar.open { transform: translateX(0); }
          .cl-grid { grid-template-columns: 1fr !important; }
        }
        @media print {
          .no-print { display: none !important; }
          .cl-main { margin-left: 0 !important; padding: 0 !important; background: white !important; }
          .letter-body { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Mobile bar */}
      <div className="cl-mobile-bar no-print">
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
        <div className="cl-sidebar-overlay no-print" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 140, backdropFilter: 'blur(4px)' }} />
      )}

      <div className={`cl-sidebar no-print${sidebarOpen ? ' open' : ''}`}>
        <Sidebar />
      </div>

      <main className="cl-main">
        {/* Header */}
        <div className="no-print" style={{ padding: '40px 40px 32px', background: 'linear-gradient(180deg, var(--bg-surface) 0%, transparent 100%)', borderBottom: '1px solid var(--border-dim)', marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Cover <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Letter</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            AI-generated cover letter tailored to any job offer. Max 350 words, professional tone.
          </p>
        </div>

        <div style={{ padding: '0 40px 80px', maxWidth: '900px' }}>
          <div className="cl-grid no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', alignItems: 'start' }}>

            {/* ── Left: inputs ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-xl)', padding: '24px' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: '800', marginBottom: '18px', color: 'var(--text-primary)' }}>Job Details</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Job Title</label>
                    <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior UX Designer"
                      style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</label>
                    <input value={company} onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Spotify"
                      style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Job Description</label>
                    <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here for the best results…"
                      rows={8}
                      style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', flexShrink: 0 }}>Language:</span>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none' }}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', color: 'var(--text-danger)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={generate}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ padding: '14px', fontSize: 'var(--text-base)', fontWeight: '800', justifyContent: 'center', opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
              >
                {isGenerating ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Writing your letter…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    Generate Cover Letter
                  </>
                )}
              </button>
            </div>

            {/* ── Right: letter output ── */}
            <div>
              {letter ? (
                <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
                  {/* Toolbar */}
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Cover Letter · {company || 'Draft'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--border-default)', background: copied ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)', color: copied ? 'var(--match-high)' : 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                        {copied
                          ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!</>
                          : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                        }
                      </button>
                      <button onClick={printLetter} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Letter body */}
                  <div ref={letterRef} className="letter-body" style={{ padding: '28px 28px', fontSize: '0.9rem', lineHeight: '1.85', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: '"Georgia", "Times New Roman", serif' }}>
                    {letter}
                  </div>

                  {/* Word count */}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-dim)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {letter.trim().split(/\s+/).length} words
                  </div>
                </section>
              ) : (
                <div style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-default)', borderRadius: 'var(--r-xl)', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center', minHeight: '300px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: 'var(--r-xl)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: '700', color: 'var(--text-primary)' }}>Your letter will appear here</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '280px', lineHeight: '1.6' }}>
                    Fill in the job details and click Generate. Make sure your CV is saved in Profile first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
