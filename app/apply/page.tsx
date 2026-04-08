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
        :root { 
          --night: #0a0c10; 
          --slate: #161b22; 
          --glass-border: rgba(255,255,255,0.08); 
          --nordic-blue: #1e40af; 
          --nordic-teal: #0891b2; 
          --forest: #10b981; 
          --glacier: #8b949e; 
          --snow: #f0f6fc; 
          --mist: #c9d1d9; 
          --slater: #484f58; 
        }
        
        body { margin: 0; background: var(--night); color: var(--snow); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        
        @media print {
          /* Hide everything except the CV */
          .no-print, header, footer, nav, button { display: none !important; }
          body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
          .print-cv { display: block !important; visibility: visible !important; position: absolute; left: 0; top: 0; width: 210mm; height: 297mm; }
          
          /* Force background colors and gradients to show in PDF */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important;
          }
          
          @page { size: A4; margin: 0; }
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Screen layout ── */}
      <div className="no-print" style={{ minHeight: '100vh', background: 'var(--night)', color: 'var(--snow)', padding: '0 0 5rem' }}>

        {/* Sticky top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,12,16,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--glass-border)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', borderRadius: '6px' }} />
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--snow)', letterSpacing: '-0.02em' }}>Applyarr</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {tailoredCv && (
              <>
                <button 
                  onClick={() => setEditMode(!editMode)} 
                  className="card-hover"
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--glacier)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}>
                  {editMode ? '👁  Preview' : '✏️  Edit Content'}
                </button>
                <button 
                  onClick={downloadPdf} 
                  className="card-hover"
                  style={{ padding: '0.5rem 1.4rem', borderRadius: '8px', background: 'var(--snow)', color: 'var(--night)', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                  ⎙  Print to PDF
                </button>
              </>
            )}
            <button onClick={() => window.close()} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'var(--glacier)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* ── Job Header ── */}
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {job.logo && <img src={job.logo} alt={job.company} style={{ width: '64px', height: '64px', borderRadius: '14px', background: 'white', objectFit: 'contain', padding: '6px', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} />}
              <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.3rem', letterSpacing: '-0.03em' }}>{job.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--glacier)', fontSize: '1rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--snow)' }}>{job.company}</span>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <span>{job.location}</span>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <span style={{ color: 'var(--nordic-teal)', fontWeight: '500' }}>{job.source}</span>
                </div>
              </div>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {job.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7dd3fc', fontWeight: '500' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* ── Job Description ── */}
              <div style={{ background: 'var(--slate)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--slater)', margin: 0 }}>The Challenge</h2>
                  <button onClick={() => setShowManualPaste(true)} style={{ fontSize: '0.75rem', color: 'var(--nordic-teal)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Edit Description</button>
                </div>

                {!showManualPaste && job.description && job.description.length > 20 ? (
                  <div style={{ fontSize: '0.95rem', color: 'var(--mist)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{job.description}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea
                      value={manualDesc}
                      onChange={e => setManualDesc(e.target.value)}
                      placeholder="Paste the job posting details here to generate a precision CV..."
                      style={{ width: '100%', minHeight: '300px', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--snow)', fontSize: '0.9rem', lineHeight: '1.6', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    <button 
                      onClick={() => { analyzeJob(job, manualDesc); setShowManualPaste(false); }}
                      style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--nordic-teal)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* ── AI Analysis ── */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem', animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--slater)', margin: 0 }}>AI Fit Score</h2>
                  {analysis && <div style={{ fontSize: '2.5rem', fontWeight: '900', color: scoreColor, letterSpacing: '-0.05em' }}>{analysis.score}<span style={{ fontSize: '1rem', opacity: 0.5 }}>%</span></div>}
                </div>
                
                {isAnalyzing ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--nordic-teal)', animation: `shimmer 1s ${i*0.2}s infinite` }} />)}
                  </div>
                ) : analysis ? (
                  <div style={{ fontSize: '0.95rem', color: 'var(--mist)', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 1rem' }}>{analysis.reasoning}</p>
                    <div style={{ padding: '1rem', background: 'rgba(8,145,178,0.1)', borderRadius: '10px', borderLeft: '3px solid var(--nordic-teal)', color: '#67e8f9', fontSize: '0.85rem' }}>
                      <strong>Strategy:</strong> {analysis.tailoringTips}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--slater)', fontSize: '0.9rem' }}>Fill in the job description to get a personalized score.</p>
                )}
              </div>

              {/* ── Generate Action ── */}
              <button
                onClick={generateCv}
                disabled={isGenerating}
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  background: isGenerating ? 'var(--slate)' : 'linear-gradient(135deg, #1e3a8a 0%, #0e7490 100%)',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  animation: 'fadeIn 0.7s ease-out'
                }}
              >
                {isGenerating ? 'Crafting Your Professional CV...' : '✦ Generate Premium CV'}
              </button>
            </div>
          </div>

          {/* ── CV Output ── */}
          {tailoredCv && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Your Tailored Masterpiece</h2>
              </div>

              {editMode ? (
                <textarea
                  value={tailoredCv}
                  onChange={e => setTailoredCv(e.target.value)}
                  style={{ width: '100%', minHeight: '600px', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--slate)', color: 'var(--snow)', fontSize: '0.9rem', fontFamily: 'monospace', lineHeight: '1.7', resize: 'vertical', outline: 'none' }}
                />
              ) : (
                <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.5)', background: 'white' }}>
                  <CvPreview markdown={tailoredCv} />
                </div>
              )}
            </div>
          )}

          {/* ── Final Action ── */}
          {tailoredCv && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '3rem' }}>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 3rem', borderRadius: '50px', background: 'var(--snow)', color: 'var(--night)', fontWeight: '800', fontSize: '1.1rem', textDecoration: 'none', transition: 'transform 0.2s' }}
              >
                Ready to Apply at {job.company} ↗
              </a>
              <p style={{ color: 'var(--slater)', fontSize: '0.85rem' }}>Source: {job.source} · {new Date().toLocaleDateString()}</p>
            </div>
          )}
      {/* ── Print-only context ── */}
      <style>{printStyles}</style>
      <div className="print-cv-container">
        {tailoredCv && <CvPreview markdown={tailoredCv} />}
      </div>
    </>
  );
}

const printStyles = `
  .print-cv-container { display: none; }
  @media print {
    .no-print, header, footer, nav, button, .card-hover { display: none !important; }
    body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; }
    .print-cv-container { 
      display: block !important; 
      visibility: visible !important; 
      position: absolute; 
      left: 0; 
      top: 0; 
      width: 210mm; 
      height: 297mm; 
      margin: 0;
      padding: 0;
    }
    #cv-print-root {
      box-shadow: none !important;
      border: none !important;
    }
    * { 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    @page { size: A4; margin: 0; }
  }
`;
