'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Job } from '@/lib/types';

// ─────────────────────────────────────────────
// Markdown → structured CV parser
// ─────────────────────────────────────────────
interface CvSection { title: string; lines: string[] }
interface ParsedCv {
  name: string;
  jobTitle: string;
  contact: string[];
  sidebarSections: CvSection[];
  mainSections: CvSection[];
  gdpr: string;
}

const SIDEBAR_KEYWORDS = ['skill', 'language', 'software', 'tool', 'competenc', 'technolog', 'additional', 'interest', 'certification', 'award', 'profil'];

function isSidebarSection(title: string) {
  const t = title.toLowerCase();
  return SIDEBAR_KEYWORDS.some(k => t.includes(k));
}

function inlineRender(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function parseMarkdownCv(md: string): ParsedCv {
  const lines = md.split('\n');
  let name = '', jobTitle = '', gdpr = '';
  const contact: string[] = [];
  const mainSections: CvSection[] = [];
  const sidebarSections: CvSection[] = [];
  let curSection: CvSection | null = null;
  let headerDone = false;

  const pushSection = () => {
    if (!curSection) return;
    if (isSidebarSection(curSection.title)) sidebarSections.push(curSection);
    else mainSections.push(curSection);
    curSection = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith('# ')) {
      name = line.replace(/^#\s*/, '');
      headerDone = false;
    } else if (!headerDone && !name && line.startsWith('## ')) {
      jobTitle = line.replace(/^##\s*/, '');
    } else if (line.startsWith('## ')) {
      // Second ## = professional title if no name found yet, else means section
      if (!name && !jobTitle) { jobTitle = line.replace(/^##\s*/, ''); continue; }
      pushSection();
      curSection = { title: line.replace(/^##\s*/, ''), lines: [] };
    } else if (line.startsWith('CONTACT:')) {
      const parts = line.replace('CONTACT:', '').split('|').map(s => s.trim()).filter(Boolean);
      contact.push(...parts);
      headerDone = true;
    } else if (line.match(/^\*?I hereby consent/i)) {
      gdpr = line.replace(/^\*|\*$/g, '').trim();
    } else if (line === '---') {
      // divider — might precede GDPR
      const next = lines[i + 1]?.trim() || '';
      if (next.match(/^\*?I hereby consent/i)) {
        gdpr = next.replace(/^\*|\*$/g, '').trim();
        i++;
      }
    } else if (curSection) {
      curSection.lines.push(raw);
    }
  }
  pushSection();

  // If jobTitle ended up as the first main section title, remove it
  if (!jobTitle && mainSections.length > 0 && mainSections[0].lines.length === 0) {
    jobTitle = mainSections.shift()!.title;
  }

  return { name, jobTitle, contact, sidebarSections, mainSections, gdpr };
}

// ─────────────────────────────────────────────
// Premium Scandinavian CV renderer
// ─────────────────────────────────────────────
const C = {
  dark: '#1c2333',
  accent: '#b8975a',   // warm Scandinavian gold
  accentLight: '#d4b27a',
  body: '#ffffff',
  text: '#1a1a2e',
  muted: '#5a6070',
  border: '#e5e5e5',
  sidebarText: '#e8e0d5',
  sidebarMuted: '#9ba3b0',
};

function SidebarLine({ line, i }: { line: string; i: number }) {
  const trim = line.trim();
  if (!trim) return null;
  if (trim.startsWith('### ')) {
    return <p key={i} style={{ fontWeight: '700', fontSize: '8.5pt', color: C.accent, margin: '8px 0 2px', letterSpacing: '0.04em' }}>{trim.replace(/^###\s*/, '')}</p>;
  }
  if (trim.startsWith('- ') || trim.startsWith('• ')) {
    return (
      <div key={i} style={{ display: 'flex', gap: '6px', margin: '2px 0', fontSize: '8.5pt', color: C.sidebarText, alignItems: 'flex-start' }}>
        <span style={{ color: C.accent, flexShrink: 0, marginTop: '1pt' }}>·</span>
        <span dangerouslySetInnerHTML={{ __html: inlineRender(trim.replace(/^[-•]\s*/, '')) }} />
      </div>
    );
  }
  return <p key={i} style={{ margin: '2px 0', fontSize: '8.5pt', color: C.sidebarMuted, lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: inlineRender(trim) }} />;
}

function MainLine({ line, i }: { line: string; i: number }) {
  const trim = line.trim();
  if (!trim) return null;
  if (trim.startsWith('### ')) {
    return (
      <div key={i} style={{ marginTop: '10px', marginBottom: '1px' }}>
        <p style={{ margin: 0, fontSize: '9.5pt', fontWeight: '700', color: C.text }} dangerouslySetInnerHTML={{ __html: inlineRender(trim.replace(/^###\s*/, '')) }} />
      </div>
    );
  }
  if (trim.startsWith('- ') || trim.startsWith('• ')) {
    return (
      <div key={i} style={{ display: 'flex', gap: '8px', margin: '2px 0', fontSize: '9pt', color: '#333', alignItems: 'flex-start' }}>
        <span style={{ color: C.accent, flexShrink: 0, fontSize: '10pt', lineHeight: '1.2' }}>–</span>
        <span dangerouslySetInnerHTML={{ __html: inlineRender(trim.replace(/^[-•]\s*/, '')) }} />
      </div>
    );
  }
  if (trim.startsWith('**') && trim.endsWith('**')) {
    return <p key={i} style={{ margin: '2px 0', fontSize: '9pt', fontWeight: '700', color: C.text }}>{trim.replace(/\*\*/g, '')}</p>;
  }
  return <p key={i} style={{ margin: '2px 0', fontSize: '9pt', color: C.muted, lineHeight: '1.55' }} dangerouslySetInnerHTML={{ __html: inlineRender(trim) }} />;
}

function CvPreview({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);

  return (
    <div id="cv-print-root" style={{
      width: '210mm',
      minHeight: '297mm',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '10pt',
      lineHeight: '1.5',
      background: C.body,
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
      margin: '0 auto',
      overflow: 'hidden',
    }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
      <div style={{
        width: '68mm',
        minHeight: '297mm',
        background: C.dark,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'relative',
      }}>
        {/* Gold top strip */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${C.accent}, ${C.accentLight})`, width: '100%' }} />

        {/* Identity block */}
        <div style={{ padding: '28px 20px 24px' }}>
          {/* Initials circle */}
          <div style={{
            width: '56px', height: '56px',
            borderRadius: '50%',
            border: `2px solid ${C.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '16pt', fontWeight: '700', color: C.accent,
            letterSpacing: '-1px',
          }}>
            {cv.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>

          <h1 style={{ fontSize: '14pt', fontWeight: '700', color: '#ffffff', margin: '0 0 4px', lineHeight: 1.1, letterSpacing: '-0.3px' }}>{cv.name}</h1>
          {cv.jobTitle && (
            <p style={{ fontSize: '8pt', color: C.accent, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>{cv.jobTitle}</p>
          )}
        </div>

        {/* Gold divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${C.accent}44, transparent)`, margin: '0 20px' }} />

        {/* Contact */}
        {cv.contact.length > 0 && (
          <div style={{ padding: '18px 20px 12px' }}>
            <p style={{ fontSize: '7pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, margin: '0 0 8px' }}>Contact</p>
            {cv.contact.map((c, i) => (
              <p key={i} style={{ fontSize: '8pt', color: C.sidebarText, margin: '3px 0', lineHeight: '1.4', wordBreak: 'break-all' }}>{c}</p>
            ))}
          </div>
        )}

        {/* Sidebar sections */}
        {cv.sidebarSections.map((section, si) => (
          <div key={si} style={{ padding: '12px 20px 4px' }}>
            <div style={{ height: '1px', background: `linear-gradient(90deg, ${C.accent}33, transparent)`, marginBottom: '12px' }} />
            <p style={{ fontSize: '7pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, margin: '0 0 8px' }}>{section.title}</p>
            {section.lines.map((line, li) => <SidebarLine key={li} line={line} i={li} />)}
          </div>
        ))}

        {/* Bottom accent */}
        <div style={{ marginTop: 'auto', height: '4px', background: `linear-gradient(90deg, transparent, ${C.accent}44)` }} />
      </div>

      {/* ── MAIN COLUMN ────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {cv.mainSections.map((section, si) => (
          <div key={si} style={{ marginBottom: '20px', pageBreakInside: 'avoid' as const }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <h2 style={{
                fontSize: '7.5pt',
                fontWeight: '700',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: C.dark,
                margin: 0,
                whiteSpace: 'nowrap',
              }}>{section.title}</h2>
              <div style={{ flex: 1, height: '1px', background: C.accent, opacity: 0.35 }} />
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
            </div>

            {/* Content */}
            <div>
              {section.lines.map((line, li) => <MainLine key={li} line={line} i={li} />)}
            </div>
          </div>
        ))}

        {/* GDPR */}
        {cv.gdpr && (
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.border}`, paddingTop: '10px' }}>
            <p style={{ fontSize: '7pt', color: '#aaa', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>{cv.gdpr}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function ApplyPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [manualDesc, setManualDesc] = useState('');
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [analysis, setAnalysis] = useState<{ score: number; reasoning: string; tailoringTips: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tailoredCv, setTailoredCv] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('applyJob');
    if (stored) {
      const parsed: Job = JSON.parse(stored);
      setJob(parsed);
      if (!parsed.description || parsed.description.length < 20) {
        setShowManualPaste(true);
      }
      analyzeJob(parsed, '');
    }
  }, []);

  const analyzeJob = async (j: Job, desc: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: { ...j, description: desc || j.description } }),
      });
      const data = await res.json();
      if (!data.error) setAnalysis(data);
    } catch {}
    setIsAnalyzing(false);
  };

  const generateCv = async () => {
    if (!job) return;
    setIsGenerating(true);
    setTailoredCv('');
    setEditMode(false);
    try {
      const res = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, manualDescription: manualDesc || undefined }),
      });
      const data = await res.json();
      setTailoredCv(data.error ? '# Error\n\n' + data.error : data.tailoredCv);
    } catch {
      setTailoredCv('# Error\n\nCould not connect to AI service.');
    }
    setIsGenerating(false);
  };

  const downloadPdf = () => window.print();

  const scoreColor = analysis
    ? analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--night)', color: 'var(--snow)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--glacier)', marginBottom: '1.5rem' }}>No job selected. Close this tab and click "Apply Now" on a job card.</p>
          <button onClick={() => window.close()} style={{ padding: '0.75rem 2rem', background: 'var(--nordic-blue)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Close Tab</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root { --night: #0d1117; --slate: #1a2332; --glass-border: rgba(255,255,255,0.1); --nordic-blue: #1e40af; --nordic-teal: #0891b2; --forest: #16a34a; --glacier: #94a3b8; --snow: #f1f5f9; --mist: #cbd5e1; --slater: #64748b; }
        body { margin: 0; background: var(--night); color: var(--snow); font-family: 'Inter', sans-serif; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          #cv-print-root { box-shadow: none !important; width: 100% !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Screen layout ── */}
      <div className="no-print" style={{ minHeight: '100vh', background: 'var(--night)', color: 'var(--snow)', padding: '0 0 4rem' }}>

        {/* Sticky top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--glass-border)', padding: '0.85rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '800', fontSize: '1.05rem', background: 'linear-gradient(135deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Applyarr</span>
            <span style={{ color: 'var(--slater)', fontSize: '0.85rem' }}>/ Apply</span>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {tailoredCv && (
              <>
                <button onClick={() => setEditMode(!editMode)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--glacier)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  {editMode ? '👁 Preview' : '✏️ Edit'}
                </button>
                <button onClick={downloadPdf} style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', background: 'var(--forest)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                  ⬇ Download PDF
                </button>
              </>
            )}
            <button onClick={() => window.close()} style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.06)', color: 'var(--glacier)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ── Job Header ── */}
          <div style={{ animation: 'fadeIn 0.35s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1rem' }}>
              {job.logo && <img src={job.logo} alt={job.company} style={{ width: '56px', height: '56px', borderRadius: '10px', background: 'white', objectFit: 'contain', padding: '4px', flexShrink: 0 }} />}
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.25rem', lineHeight: 1.2 }}>{job.title}</h1>
                <p style={{ color: 'var(--glacier)', fontSize: '0.95rem', margin: 0 }}>
                  {job.company} <span style={{ opacity: 0.4 }}>·</span> {job.location} <span style={{ opacity: 0.4 }}>·</span> <em style={{ color: 'var(--slater)' }}>{job.source}</em>
                </p>
              </div>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {job.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--glass-border)' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* ── Job Description or Paste ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--glacier)', margin: 0 }}>Job Description</h2>
              {!showManualPaste && (
                <button onClick={() => setShowManualPaste(true)} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--glacier)', cursor: 'pointer' }}>
                  + Add / Replace Description
                </button>
              )}
            </div>

            {/* Original description */}
            {!showManualPaste && job.description && job.description.length > 20 && (
              <p style={{ fontSize: '0.9rem', color: 'var(--mist)', lineHeight: '1.75', margin: 0, whiteSpace: 'pre-wrap' }}>{job.description}</p>
            )}

            {/* Paste area */}
            {showManualPaste && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--slater)', margin: 0 }}>Paste the full job description below for better CV tailoring and analysis:</p>
                <textarea
                  value={manualDesc}
                  onChange={e => setManualDesc(e.target.value)}
                  placeholder="Paste the full job posting here…"
                  style={{ width: '100%', minHeight: '180px', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'var(--snow)', fontSize: '0.875rem', lineHeight: '1.6', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => { analyzeJob(job, manualDesc); setShowManualPaste(false); }}
                  style={{ alignSelf: 'flex-start', padding: '0.5rem 1.2rem', borderRadius: '8px', background: 'var(--nordic-teal)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  Refresh Analysis ↻
                </button>
              </div>
            )}
          </div>

          {/* ── AI Analysis ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--glacier)', margin: 0 }}>AI Match Analysis</h2>
              {isAnalyzing && <span style={{ fontSize: '0.8rem', color: 'var(--nordic-teal)', animation: 'shimmer 1.5s infinite' }}>Analyzing…</span>}
              {analysis && <span style={{ fontSize: '1.6rem', fontWeight: '900', color: scoreColor }}>{analysis.score}%</span>}
            </div>
            {analysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--mist)', margin: 0 }}>{analysis.reasoning}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--nordic-teal)', fontStyle: 'italic', margin: 0 }}>💡 {analysis.tailoringTips}</p>
              </div>
            ) : !isAnalyzing ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--slater)', margin: 0 }}>Add your CV in Profile to enable match analysis.</p>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--nordic-teal)', animation: `shimmer 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            )}
          </div>

          {/* ── Generate CV ── */}
          <div style={{ animation: 'fadeIn 0.55s ease' }}>
            <button
              onClick={generateCv}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '12px',
                background: isGenerating ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #1e3a5f 0%, #0891b2 100%)',
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isGenerating ? '⏳ Generating ATS-optimized CV…' : '✦ Generate Tailored CV with AI'}
            </button>
          </div>

          {/* ── CV Output ── */}
          {tailoredCv && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Your Tailored CV</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => navigator.clipboard.writeText(tailoredCv)} style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--snow)', cursor: 'pointer', fontSize: '0.8rem' }}>📋 Copy</button>
                  <button onClick={() => setEditMode(!editMode)} style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--glacier)', cursor: 'pointer', fontSize: '0.8rem' }}>{editMode ? '👁 Preview' : '✏️ Edit'}</button>
                  <button onClick={downloadPdf} style={{ padding: '0.4rem 1rem', borderRadius: '7px', background: 'var(--forest)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>⬇ Download PDF</button>
                </div>
              </div>

              {editMode ? (
                <textarea
                  value={tailoredCv}
                  onChange={e => setTailoredCv(e.target.value)}
                  style={{ width: '100%', minHeight: '400px', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.35)', color: 'var(--snow)', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
                  <CvPreview markdown={tailoredCv} />
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.6s ease' }}>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))', color: 'white', fontWeight: '700', fontSize: '1rem', textDecoration: 'none' }}
            >
              Open Original Job Posting ↗
            </a>
            <p style={{ textAlign: 'center', fontSize: '0.77rem', color: 'var(--slater)', margin: 0 }}>
              Posted on {job.source} · {job.postedAt}
            </p>
          </div>
        </div>
      </div>

      {/* ── Print-only view (hidden on screen) ── */}
      {tailoredCv && <div style={{ display: 'none' }} className="print-cv"><CvPreview markdown={tailoredCv} /></div>}
      <style>{`@media print { body > div:first-child { display: none !important; } .print-cv { display: block !important; } }`}</style>
    </>
  );
}
