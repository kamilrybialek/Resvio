'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Job } from '@/lib/types';
import { CV_TEMPLATES, DEFAULT_TEMPLATE_ID, TemplateId } from '@/lib/cv-templates';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CvSection { title: string; lines: string[] }
interface ParsedCv {
  name: string;
  jobTitle: string;
  contact: string[];
  sidebarSections: CvSection[];
  mainSections: CvSection[];
  allSections: CvSection[];
  gdpr: string;
}
interface RoleEntry {
  title: string; company: string; dates: string;
  location: string; bullets: string[];
}

// ─────────────────────────────────────────────
// Sidebar keyword routing
// ─────────────────────────────────────────────
const SIDEBAR_KEYWORDS = [
  'skill', 'language', 'software', 'tool', 'competenc',
  'technolog', 'additional', 'interest', 'certification', 'award', 'profil',
];
function isSidebarSection(title: string) {
  const t = title.toLowerCase();
  return SIDEBAR_KEYWORDS.some(k => t.includes(k));
}

// ─────────────────────────────────────────────
// Inline markdown renderer
// ─────────────────────────────────────────────
function inlineRender(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// ─────────────────────────────────────────────
// Markdown CV parser
// ─────────────────────────────────────────────
function parseMarkdownCv(md: string): ParsedCv {
  const lines = md.split('\n');
  let name = '', jobTitle = '', gdpr = '';
  const contact: string[] = [];
  const mainSections: CvSection[] = [];
  const sidebarSections: CvSection[] = [];
  const allSections: CvSection[] = [];
  let curSection: CvSection | null = null;

  const pushSection = () => {
    if (!curSection) return;
    allSections.push(curSection);
    if (isSidebarSection(curSection.title)) sidebarSections.push(curSection);
    else mainSections.push(curSection);
    curSection = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith('# ')) {
      name = line.replace(/^#\s*/, '');
    } else if (line.startsWith('## ')) {
      // If we have a name but no sections/contact yet → this is the professional title
      if (name && !jobTitle && allSections.length === 0 && contact.length === 0 && !curSection) {
        jobTitle = line.replace(/^##\s*/, '');
      } else {
        pushSection();
        curSection = { title: line.replace(/^##\s*/, ''), lines: [] };
      }
    } else if (line.startsWith('CONTACT:')) {
      const parts = line.replace('CONTACT:', '').split('|').map(s => s.trim()).filter(Boolean);
      contact.push(...parts);
    } else if (
      line.match(/^I (hereby )?consent/i) ||
      line.match(/^\*I (hereby )?consent/i) ||
      line.match(/^Wyrażam zgodę/i) ||
      line.match(/^Jag samtycker/i)
    ) {
      gdpr = line.replace(/^\*|\*$/g, '').trim();
    } else if (line === '---') {
      const next = lines[i + 1]?.trim() || '';
      if (
        next.match(/^I (hereby )?consent/i) ||
        next.match(/^\*I (hereby )?consent/i) ||
        next.match(/^Wyrażam/i) ||
        next.match(/^Jag samtycker/i)
      ) {
        gdpr = next.replace(/^\*|\*$/g, '').trim();
        i++;
      }
    } else if (curSection) {
      curSection.lines.push(raw);
    }
  }
  pushSection();

  return { name, jobTitle, contact, sidebarSections, mainSections, allSections, gdpr };
}

// ─────────────────────────────────────────────
// Role/entry parser (for experience & education)
// ─────────────────────────────────────────────
function parseRoles(lines: string[]): RoleEntry[] {
  const roles: RoleEntry[] = [];
  let current: RoleEntry | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('### ')) {
      if (current) roles.push(current);
      const header = line.slice(4);
      const parts = header.split('|').map(s => s.trim());
      current = {
        title: parts[0] || '',
        company: parts[1] || '',
        dates: parts[2] || '',
        location: '',
        bullets: [],
      };
    } else if (current) {
      if (line.startsWith('- ') || line.startsWith('• ')) {
        current.bullets.push(line.slice(2));
      } else if (!current.location && !line.startsWith('#')) {
        current.location = line;
      }
    }
  }
  if (current) roles.push(current);
  return roles;
}

// ─────────────────────────────────────────────
// Color palettes — world-class designs
// ─────────────────────────────────────────────

// Template 1: Executive (clean one-column, blue accents)
const E = {
  bg: '#ffffff', text: '#0d1117', muted: '#374151', light: '#6b7280',
  accent: '#0057b8', accentMid: '#0070e0',
  border: '#dde1e7', divider: '#c8d0db',
};

// Template 2: Nordic Premium (dark navy sidebar, gold accents)
const N = {
  sidebar: '#0f1923', sidebarMid: '#162030',
  accent: '#c89a46', accentLight: '#e3b86e',
  main: '#ffffff', text: '#111827', muted: '#374151',
  border: '#e5e7eb', sideText: '#f0f4f8', sideMuted: '#8fa3bb',
};

// Template 3: Atlas (full-width navy header + two-column body)
const A = {
  header: '#1b3259', headerText: '#ffffff', headerSub: '#93c5fd',
  bg: '#ffffff', surface: '#f0f5ff', text: '#0f172a', muted: '#475569',
  accent: '#1d4ed8', accentMid: '#3b82f6', border: '#e2e8f0',
};

// ─────────────────────────────────────────────
// RENDERER 1 — Executive (clean one-column)
// ─────────────────────────────────────────────
function CvMinimal({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);

  const renderSection = (section: CvSection) => {
    const key = section.title.toLowerCase();
    const isRole = key.includes('experience') || key.includes('education');
    const roles = isRole ? parseRoles(section.lines) : [];

    return (
      <div style={{ marginBottom: '9px' }}>
        {/* Section header with extending rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
          <h2 style={{
            fontSize: '5.5pt', fontWeight: '800', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: E.accent,
            margin: 0, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {section.title.replace('PROFESSIONAL ', '').replace(' & COMPETENCIES', '& COMP.')}
          </h2>
          <div style={{ flex: 1, height: '0.75px', background: E.divider }} />
        </div>

        {isRole && roles.length > 0 ? (
          roles.map((role, ri) => (
            <div key={ri} style={{ marginBottom: ri < roles.length - 1 ? '6px' : 0, paddingLeft: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '8.5pt', fontWeight: '700', color: E.text }}>
                  {role.company || role.title}
                </span>
                {role.dates && (
                  <span style={{ fontSize: '7pt', color: E.light, flexShrink: 0, fontStyle: 'italic' }}>
                    {role.dates}
                  </span>
                )}
              </div>
              {role.company && role.title && (
                <p style={{ fontSize: '7.5pt', color: E.accent, margin: '1px 0 2px', fontWeight: '500' }}>
                  {role.title}{role.location ? ` · ${role.location}` : ''}
                </p>
              )}
              {role.bullets.map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: '5px', margin: '1.5px 0', fontSize: '7.5pt', alignItems: 'flex-start' }}>
                  <span style={{ color: E.accentMid, flexShrink: 0, fontSize: '7pt', lineHeight: '1.4' }}>▸</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineRender(b) }} style={{ color: E.muted }} />
                </div>
              ))}
            </div>
          ))
        ) : (
          section.lines.map((raw, li) => {
            const t = raw.trim();
            if (!t) return null;
            if (t.startsWith('### ')) {
              const parts = t.slice(4).split('|').map(s => s.trim());
              return (
                <div key={li} style={{ marginBottom: '3px', paddingLeft: '2px' }}>
                  <span style={{ fontSize: '8pt', fontWeight: '700', color: E.text }}>{parts[0]}</span>
                  {parts[1] && <span style={{ fontSize: '7.5pt', color: E.muted }}> · {parts[1]}</span>}
                  {parts[2] && <span style={{ fontSize: '7pt', color: E.light }}> · {parts[2]}</span>}
                </div>
              );
            }
            if (t.startsWith('- ') || t.startsWith('• ')) {
              return (
                <div key={li} style={{ display: 'flex', gap: '5px', margin: '1.5px 0', fontSize: '7.5pt', alignItems: 'flex-start' }}>
                  <span style={{ color: E.accentMid, flexShrink: 0, fontSize: '7pt', lineHeight: '1.4' }}>▸</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineRender(t.slice(2)) }} style={{ color: E.muted }} />
                </div>
              );
            }
            return (
              <p key={li} style={{ margin: '0 0 2px', fontSize: '8pt', color: E.muted, lineHeight: '1.55', paddingLeft: '2px' }}
                dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      background: E.bg, overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '9pt', lineHeight: '1.45', color: E.text,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
    }}>
      {/* Gradient top accent strip */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${E.accent} 0%, ${E.accentMid} 50%, #7c3aed 100%)`, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '13mm 18mm 9mm', flexShrink: 0 }}>
        <h1 style={{ fontSize: '21pt', fontWeight: '800', margin: '0 0 4px', letterSpacing: '-0.03em', color: E.text, lineHeight: 1 }}>
          {cv.name}
        </h1>
        {cv.jobTitle && (
          <p style={{ fontSize: '9.5pt', color: E.accent, fontWeight: '600', margin: '0 0 7px', letterSpacing: '0.01em' }}>
            {cv.jobTitle}
          </p>
        )}
        {cv.contact.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', fontSize: '7pt', color: E.muted }}>
            {cv.contact.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ padding: '0 6px', color: E.divider, fontWeight: '300' }}>|</span>}
                <span>{c}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Accent separator */}
      <div style={{ margin: '0 18mm 0', height: '1.5px', background: `linear-gradient(90deg, ${E.accent}, transparent)`, flexShrink: 0 }} />

      {/* Body */}
      <div style={{ flex: 1, padding: '7mm 18mm', overflow: 'hidden' }}>
        {cv.allSections.map((s, i) => <React.Fragment key={i}>{renderSection(s)}</React.Fragment>)}
      </div>

      {/* GDPR */}
      {cv.gdpr && (
        <div style={{ padding: '3mm 18mm 5mm', borderTop: `1px solid ${E.border}`, flexShrink: 0 }}>
          <p style={{ fontSize: '5.5pt', color: '#aaa', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 2 — Nordic Premium
// ─────────────────────────────────────────────
function CvNordic({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);
  const initials = cv.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  const renderMainSection = (section: CvSection) => {
    const key = section.title.toLowerCase();
    const isRole = key.includes('experience') || key.includes('education');
    const roles = isRole ? parseRoles(section.lines) : [];

    return (
      <div style={{ marginBottom: '13px' }}>
        {/* Section header with left gold accent bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
          <div style={{ width: '3px', height: '13px', background: N.accent, borderRadius: '2px', flexShrink: 0 }} />
          <h2 style={{ fontSize: '6.5pt', fontWeight: '800', letterSpacing: '0.18em', textTransform: 'uppercase', color: N.text, margin: 0 }}>
            {section.title}
          </h2>
          <div style={{ flex: 1, height: '0.5px', background: N.border }} />
        </div>

        {isRole && roles.length > 0 ? (
          roles.map((role, ri) => (
            <div key={ri} style={{ marginBottom: ri < roles.length - 1 ? '8px' : 0, paddingLeft: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '8.5pt', fontWeight: '700', color: N.text }}>
                  {role.company || role.title}
                </span>
                {role.dates && (
                  <span style={{ fontSize: '6.5pt', color: '#fff', flexShrink: 0, background: N.accent, padding: '1px 5px', borderRadius: '3px', fontWeight: '600' }}>
                    {role.dates}
                  </span>
                )}
              </div>
              {role.company && role.title && (
                <p style={{ fontSize: '7.5pt', color: N.accent, margin: '1px 0 3px', fontWeight: '500' }}>
                  {role.title}{role.location ? ` · ${role.location}` : ''}
                </p>
              )}
              {role.bullets.map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: '6px', margin: '1.5px 0', fontSize: '7.5pt', color: N.muted, alignItems: 'flex-start' }}>
                  <span style={{ color: N.accent, flexShrink: 0, fontSize: '8pt', lineHeight: '1.3' }}>–</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineRender(b) }} style={{ color: N.text }} />
                </div>
              ))}
            </div>
          ))
        ) : (
          <div style={{ paddingLeft: '10px' }}>
            {section.lines.map((raw, li) => {
              const t = raw.trim();
              if (!t) return null;
              if (t.startsWith('- ') || t.startsWith('• ')) {
                return (
                  <div key={li} style={{ display: 'flex', gap: '6px', margin: '2px 0', fontSize: '7.5pt', color: N.muted, alignItems: 'flex-start' }}>
                    <span style={{ color: N.accent, flexShrink: 0 }}>–</span>
                    <span dangerouslySetInnerHTML={{ __html: inlineRender(t.replace(/^[-•]\s*/, '')) }} style={{ color: N.text }} />
                  </div>
                );
              }
              return (
                <p key={li} style={{ margin: '2px 0', fontSize: '8pt', color: N.muted, lineHeight: '1.55' }}
                  dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      display: 'flex', flexDirection: 'row',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      background: '#ffffff',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
      overflow: 'hidden',
    }}>
      {/* ── SIDEBAR ── */}
      <div style={{ width: '67mm', background: N.sidebar, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Top gold accent bar */}
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${N.accent}, ${N.accentLight})`, flexShrink: 0 }} />

        {/* Avatar + identity block */}
        <div style={{ padding: '20px 16px 16px', background: N.sidebarMid, flexShrink: 0 }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            border: `2.5px solid ${N.accent}`,
            background: `${N.accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
            fontSize: '13pt', fontWeight: '800', color: N.accent, letterSpacing: '-0.02em',
          }}>
            {initials}
          </div>
          <h1 style={{ fontSize: '11pt', fontWeight: '800', color: N.sideText, margin: '0 0 4px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {cv.name}
          </h1>
          {cv.jobTitle && (
            <p style={{ fontSize: '6.5pt', color: N.accent, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '600' }}>
              {cv.jobTitle}
            </p>
          )}
        </div>

        {/* Contact */}
        {cv.contact.length > 0 && (
          <div style={{ padding: '12px 16px 8px', borderTop: `1px solid ${N.accent}25`, flexShrink: 0 }}>
            <p style={{ fontSize: '5.5pt', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', color: N.accent, margin: '0 0 7px' }}>
              Contact
            </p>
            {cv.contact.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', margin: '3px 0' }}>
                <span style={{ color: N.accent, flexShrink: 0, fontSize: '5pt', marginTop: '2pt' }}>◆</span>
                <p style={{ fontSize: '7pt', color: N.sideText, margin: 0, lineHeight: '1.4', wordBreak: 'break-all' }}>{c}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sidebar sections (Skills, Languages, etc.) */}
        {cv.sidebarSections.map((section, si) => (
          <div key={si} style={{ padding: '10px 16px 6px', borderTop: `1px solid ${N.accent}25`, flexShrink: 0 }}>
            <p style={{ fontSize: '5.5pt', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', color: N.accent, margin: '0 0 8px' }}>
              {section.title}
            </p>
            {section.lines.map((line, li) => {
              const t = line.trim();
              if (!t) return null;
              if (t.startsWith('### ')) {
                return <p key={li} style={{ fontSize: '7pt', fontWeight: '700', color: N.accentLight, margin: '6px 0 2px' }}>{t.replace(/^###\s*/, '')}</p>;
              }
              if (t.startsWith('- ') || t.startsWith('• ')) {
                return (
                  <div key={li} style={{ display: 'flex', gap: '5px', margin: '2.5px 0', fontSize: '7pt', color: N.sideText, alignItems: 'flex-start' }}>
                    <span style={{ color: N.accent, flexShrink: 0, marginTop: '1.5pt', fontSize: '5pt' }}>◆</span>
                    <span dangerouslySetInnerHTML={{ __html: inlineRender(t.replace(/^[-•]\s*/, '')) }} />
                  </div>
                );
              }
              return (
                <p key={li} style={{ margin: '2px 0', fontSize: '7pt', color: N.sideMuted, lineHeight: '1.5' }}
                  dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
              );
            })}
          </div>
        ))}

        {/* Bottom glow accent */}
        <div style={{ marginTop: 'auto', height: '40px', background: `linear-gradient(0deg, ${N.accent}20, transparent)` }} />
      </div>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex: 1, padding: '22px 18px 14px', display: 'flex', flexDirection: 'column', background: '#ffffff', minWidth: 0 }}>
        {cv.mainSections.map((section, si) => (
          <React.Fragment key={si}>{renderMainSection(section)}</React.Fragment>
        ))}
        {cv.gdpr && (
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${N.border}`, paddingTop: '6px' }}>
            <p style={{ fontSize: '5.5pt', color: '#bbb', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 3 — Atlas (navy header + two-column)
// ─────────────────────────────────────────────
function CvGrid({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);
  const findSec = (kw: string) => cv.allSections.find(s => s.title.toLowerCase().includes(kw.toLowerCase()));

  const summary = findSec('summary');
  const experience = findSec('experience');
  const education = findSec('education');
  const skills = findSec('skill');
  const languages = findSec('language');

  const expRoles = experience ? parseRoles(experience.lines) : [];
  const eduRoles = education ? parseRoles(education.lines) : [];

  const SecHeader = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      <div style={{ width: '10px', height: '2px', background: A.accent, borderRadius: '1px', flexShrink: 0 }} />
      <h2 style={{ fontSize: '5.5pt', fontWeight: '800', letterSpacing: '0.22em', textTransform: 'uppercase', color: A.accent, margin: 0 }}>
        {title.replace('PROFESSIONAL ', '')}
      </h2>
    </div>
  );

  // Parse skill chips from lines (handles "- React, TypeScript" or "- React" styles)
  const skillChips = (skills?.lines || [])
    .flatMap(l => l.split(/[,;]|(?:\s*•\s*)|(?:\s*-\s+)/).map(s => s.trim().replace(/^[-•]\s*/, '')))
    .filter(Boolean);

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      background: A.bg, overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '8.5pt', lineHeight: '1.4', color: A.text,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
    }}>
      {/* ── FULL-WIDTH HEADER BAND ── */}
      <div style={{ background: A.header, padding: '14mm 18mm 12mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          {cv.jobTitle && (
            <p style={{ fontSize: '6.5pt', color: A.headerSub, fontWeight: '600', margin: '0 0 4px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {cv.jobTitle}
            </p>
          )}
          <h1 style={{ fontSize: '22pt', fontWeight: '800', color: A.headerText, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {cv.name}
          </h1>
        </div>
        {cv.contact.length > 0 && (
          <div style={{ textAlign: 'right', fontSize: '7pt', color: A.headerSub, flexShrink: 0, maxWidth: '100mm' }}>
            {cv.contact.map((c, i) => <p key={i} style={{ margin: '2px 0', wordBreak: 'break-all' }}>{c}</p>)}
          </div>
        )}
      </div>

      {/* Summary strip (if exists) */}
      {summary && (
        <div style={{ background: A.surface, borderBottom: `1px solid ${A.border}`, padding: '7px 18mm', flexShrink: 0 }}>
          <p style={{ fontSize: '7.5pt', color: A.muted, margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>
            {summary.lines.filter(l => l.trim()).map(l => l.trim().replace(/^[-•]\s*/, '')).join(' ')}
          </p>
        </div>
      )}

      {/* ── TWO-COLUMN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Experience (60%) */}
        <div style={{ flex: '3', borderRight: `1px solid ${A.border}`, padding: '11px 13mm 10px 18mm', overflow: 'hidden' }}>
          <SecHeader title="Experience" />
          {expRoles.map((role, ri) => (
            <div key={ri} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '8.5pt', fontWeight: '700', color: A.text }}>{role.company || role.title}</span>
                {role.dates && (
                  <span style={{ fontSize: '6.5pt', color: A.muted, flexShrink: 0 }}>{role.dates}</span>
                )}
              </div>
              {role.company && role.title && (
                <p style={{ fontSize: '7.5pt', color: A.accent, margin: '1px 0 2px', fontWeight: '500' }}>
                  {role.title}{role.location ? ` · ${role.location}` : ''}
                </p>
              )}
              {role.bullets.map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: '5px', margin: '1.5px 0', fontSize: '7.5pt', alignItems: 'flex-start' }}>
                  <span style={{ color: A.accentMid, flexShrink: 0, fontSize: '7pt', lineHeight: '1.4' }}>▸</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineRender(b) }} style={{ color: A.muted }} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: Education + Skills + Languages (40%) */}
        <div style={{ flex: '2', padding: '11px 18mm 10px 13mm', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
          {/* Education */}
          {(eduRoles.length > 0 || education) && (
            <div>
              <SecHeader title="Education" />
              {eduRoles.length > 0 ? eduRoles.map((r, ri) => (
                <div key={ri} style={{ marginBottom: '6px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: '700', margin: '0 0 1px', color: A.text }}>{r.title}</p>
                  {r.company && <p style={{ fontSize: '7.5pt', color: A.muted, margin: '0 0 1px' }}>{r.company}</p>}
                  {(r.dates || r.location) && (
                    <p style={{ fontSize: '7pt', color: A.muted, margin: 0 }}>{[r.dates, r.location].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              )) : education?.lines.filter(l => l.trim()).map((line, li) => {
                const t = line.trim();
                if (t.startsWith('### ')) {
                  const parts = t.slice(4).split('|').map(s => s.trim());
                  return (
                    <div key={li} style={{ marginBottom: '5px' }}>
                      <p style={{ fontSize: '8pt', fontWeight: '700', margin: '0 0 1px' }}>{parts[0]}</p>
                      {parts[1] && <p style={{ fontSize: '7.5pt', color: A.muted, margin: 0 }}>{parts[1]}{parts[2] ? ` · ${parts[2]}` : ''}</p>}
                    </div>
                  );
                }
                return <p key={li} style={{ fontSize: '7.5pt', color: A.muted, margin: '1px 0' }} dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />;
              })}
            </div>
          )}

          {/* Skills as tag chips */}
          {skillChips.length > 0 && (
            <div>
              <SecHeader title="Skills" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {skillChips.map((skill, si) => (
                  <span key={si} style={{
                    fontSize: '6.5pt', padding: '2px 7px', borderRadius: '3px',
                    background: '#dbeafe', color: A.accent,
                    border: `1px solid #bfdbfe`, fontWeight: '500',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages && (
            <div>
              <SecHeader title="Languages" />
              {languages.lines.filter(l => l.trim()).map((line, li) => {
                const t = line.trim().replace(/^[-•]\s*/, '');
                if (!t) return null;
                return <p key={li} style={{ fontSize: '7.5pt', color: A.muted, margin: '2px 0' }}>{t}</p>;
              })}
            </div>
          )}
        </div>
      </div>

      {/* GDPR */}
      {cv.gdpr && (
        <div style={{ padding: '3mm 18mm 4mm', borderTop: `1px solid ${A.border}`, background: A.surface, flexShrink: 0 }}>
          <p style={{ fontSize: '5.5pt', color: '#bbb', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CV Preview dispatcher
// ─────────────────────────────────────────────
function CvPreview({ markdown, templateId }: { markdown: string; templateId: TemplateId }) {
  if (templateId === 'minimal') return <CvMinimal markdown={markdown} />;
  if (templateId === 'grid') return <CvGrid markdown={markdown} />;
  return <CvNordic markdown={markdown} />;
}

// ─────────────────────────────────────────────
// Template selector
// ─────────────────────────────────────────────
const TEMPLATE_PREVIEWS: Record<string, React.ReactNode> = {
  minimal: (
    <svg viewBox="0 0 60 44" width="60" height="44" style={{ display: 'block' }}>
      <rect width="60" height="44" rx="2" fill="#fff" />
      <rect x="0" y="0" width="60" height="2" fill="#0057b8" />
      <rect x="4" y="5" width="22" height="3" rx="1" fill="#0d1117" />
      <rect x="4" y="10" width="12" height="2" rx="1" fill="#0057b8" />
      <rect x="4" y="14" width="52" height="0.5" fill="#c8d0db" />
      <rect x="4" y="17" width="20" height="1.5" rx="0.5" fill="#374151" />
      <rect x="4" y="20" width="40" height="1" rx="0.5" fill="#6b7280" />
      <rect x="4" y="22" width="36" height="1" rx="0.5" fill="#6b7280" />
      <rect x="4" y="26" width="20" height="1.5" rx="0.5" fill="#374151" />
      <rect x="4" y="29" width="44" height="1" rx="0.5" fill="#6b7280" />
      <rect x="4" y="31" width="38" height="1" rx="0.5" fill="#6b7280" />
    </svg>
  ),
  sidebar: (
    <svg viewBox="0 0 60 44" width="60" height="44" style={{ display: 'block' }}>
      <rect width="60" height="44" rx="2" fill="#fff" />
      <rect width="19" height="44" rx="2" fill="#0f1923" />
      <rect x="0" y="0" width="19" height="2" fill="#c89a46" />
      <rect x="2" y="5" width="8" height="8" rx="4" fill="none" stroke="#c89a46" strokeWidth="0.8" />
      <rect x="2" y="15" width="12" height="1.5" rx="0.5" fill="#f0f4f8" />
      <rect x="2" y="18" width="9" height="1" rx="0.5" fill="#c89a46" />
      <rect x="2" y="22" width="14" height="0.8" rx="0.4" fill="#8fa3bb" />
      <rect x="2" y="24" width="12" height="0.8" rx="0.4" fill="#8fa3bb" />
      <rect x="2" y="26" width="13" height="0.8" rx="0.4" fill="#8fa3bb" />
      <rect x="22" y="5" width="20" height="1.5" rx="0.5" fill="#111827" />
      <rect x="22" y="8" width="35" height="0.5" fill="#e5e7eb" />
      <rect x="22" y="11" width="18" height="1.2" rx="0.4" fill="#374151" />
      <rect x="22" y="14" width="34" height="0.8" rx="0.4" fill="#6b7280" />
      <rect x="22" y="16" width="30" height="0.8" rx="0.4" fill="#6b7280" />
      <rect x="22" y="21" width="18" height="1.2" rx="0.4" fill="#374151" />
      <rect x="22" y="24" width="32" height="0.8" rx="0.4" fill="#6b7280" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 60 44" width="60" height="44" style={{ display: 'block' }}>
      <rect width="60" height="44" rx="2" fill="#fff" />
      <rect width="60" height="14" rx="2" fill="#1b3259" />
      <rect x="4" y="3" width="18" height="3" rx="1" fill="#fff" />
      <rect x="4" y="8" width="10" height="1.5" rx="0.5" fill="#93c5fd" />
      <rect x="36" y="4" width="18" height="1" rx="0.5" fill="#93c5fd" />
      <rect x="36" y="6.5" width="14" height="1" rx="0.5" fill="#93c5fd" />
      <rect x="36" y="9" width="16" height="1" rx="0.5" fill="#93c5fd" />
      <rect x="4" y="16" width="26" height="1.5" rx="0.5" fill="#0f172a" />
      <rect x="4" y="19" width="24" height="0.8" rx="0.4" fill="#475569" />
      <rect x="4" y="21" width="26" height="0.8" rx="0.4" fill="#475569" />
      <rect x="4" y="24" width="20" height="1.2" rx="0.4" fill="#0f172a" />
      <rect x="4" y="27" width="24" height="0.8" rx="0.4" fill="#475569" />
      <rect x="32" y="16" width="24" height="1.2" rx="0.4" fill="#0f172a" />
      <rect x="32" y="19" width="20" height="0.8" rx="0.4" fill="#475569" />
      <rect x="32" y="22" width="10" height="4" rx="1" fill="#dbeafe" />
      <rect x="43" y="22" width="12" height="4" rx="1" fill="#dbeafe" />
    </svg>
  ),
};

function TemplateSelector({ selected, onChange }: { selected: TemplateId; onChange: (id: TemplateId) => void }) {
  return (
    <div>
      <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
        CV Template
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CV_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: '1', minWidth: '90px',
              padding: '10px 8px',
              borderRadius: 'var(--r-lg)',
              border: selected === t.id ? '1.5px solid var(--border-accent)' : '1px solid var(--border-dim)',
              background: selected === t.id ? 'var(--accent-dim)' : 'var(--bg-surface)',
              color: selected === t.id ? 'var(--accent-light)' : 'var(--text-tertiary)',
              cursor: 'pointer', textAlign: 'center',
              transition: 'all var(--duration-fast) ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}
          >
            <div style={{ borderRadius: '4px', overflow: 'hidden', border: selected === t.id ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)', opacity: selected === t.id ? 1 : 0.7, transition: 'opacity var(--duration-fast) ease' }}>
              {TEMPLATE_PREVIEWS[t.id]}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: '700' }}>{t.name}</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.7, lineHeight: 1.3 }}>{t.tagline}</div>
          </button>
        ))}
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE_ID);

  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const [cvScale, setCvScale] = useState(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Responsive CV scale
  useEffect(() => {
    const updateScale = () => {
      if (!cvPreviewRef.current) return;
      const containerWidth = cvPreviewRef.current.offsetWidth;
      const cvWidthPx = 210 * 3.7795; // 210mm in px at 96dpi
      setCvScale(Math.min(1, containerWidth / cvWidthPx));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [tailoredCv]);

  useEffect(() => {
    const stored = sessionStorage.getItem('applyJob');
    if (stored) {
      const parsed: Job = JSON.parse(stored);
      setJob(parsed);
      if (!parsed.description || parsed.description.length < 20) setShowManualPaste(true);
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
    } catch { /* silent */ }
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
        body: JSON.stringify({ job, manualDescription: manualDesc || undefined, templateId: selectedTemplate }),
      });
      const data = await res.json();
      setTailoredCv(data.error ? '# Error\n\n' + data.error : data.tailoredCv);
    } catch {
      setTailoredCv('# Error\n\nCould not connect to AI service.');
    }
    setIsGenerating(false);
  };

  const downloadPdf = async () => {
    if (!cvPreviewRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const html = cvPreviewRef.current.innerHTML;
      const res = await fetch('/api/cv-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: `CV_${job?.company || 'Application'}.pdf` }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${job?.company || 'Application'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback: print dialog
        window.print();
      }
    } catch {
      window.print();
    }
    setIsDownloadingPdf(false);
  };

  const scoreColor = analysis
    ? analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--r-xl)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: '800', marginBottom: '8px' }}>No job selected</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '24px' }}>Close this tab and click "Tailor CV" on a job card.</p>
          <button onClick={() => window.close()} className="btn btn-primary" style={{ padding: '10px 24px' }}>Close Tab</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        body { margin: 0; }
        .apply-page-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
        .apply-job-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
        .apply-topbar-actions { display: flex; gap: 8px; align-items: center; }
        .apply-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-dim);
          border-radius: var(--r-xl);
          padding: 20px;
          animation: fadeInUp 0.35s var(--ease-out) both;
        }
        .apply-section-label {
          font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.14em; color: var(--text-tertiary); margin: 0 0 14px;
        }
        @media (max-width: 900px) {
          .apply-page-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .apply-job-header { flex-direction: column !important; gap: 10px !important; }
          .apply-content { padding: 16px 12px 80px !important; }
          .apply-topbar-actions button span { display: none; }
        }
        @media print {
          .no-print, header, footer, nav, button { display: none !important; }
          body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
          .print-cv-container {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0; top: 0;
            width: 210mm; height: 297mm;
            margin: 0; padding: 0;
          }
          #cv-print-root { box-shadow: none !important; border: none !important; transform: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* ── Screen layout ── */}
      <div className="no-print" style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

        {/* Sticky top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg-surface)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-dim)',
          padding: '0 24px', height: '56px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: 'var(--gradient-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99,102,241,0.35)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Apply<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>arr</span>
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '4px' }}>· CV Tailor</span>
          </a>
          <div className="apply-topbar-actions">
            {tailoredCv && (
              <>
                <button onClick={() => setEditMode(!editMode)} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 'var(--text-xs)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {editMode
                      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      : <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                    }
                  </svg>
                  <span>{editMode ? 'Preview' : 'Edit'}</span>
                </button>
                <button onClick={downloadPdf} disabled={isDownloadingPdf} className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 'var(--text-xs)', opacity: isDownloadingPdf ? 0.7 : 1 }}>
                  {isDownloadingPdf ? (
                    <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  <span>{isDownloadingPdf ? 'Generating…' : 'Download PDF'}</span>
                </button>
              </>
            )}
            <button onClick={() => window.close()} style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-md)', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="apply-content" style={{ maxWidth: '1060px', margin: '0 auto', padding: '28px 24px 80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Job Header ── */}
          <div className="apply-card" style={{ animationDelay: '0s' }}>
            <div className="apply-job-header">
              {job.logo
                ? <img src={job.logo} alt={job.company} style={{ width: '52px', height: '52px', borderRadius: 'var(--r-md)', background: '#fff', objectFit: 'contain', padding: '4px', flexShrink: 0, border: '1px solid var(--border-dim)' }} />
                : <div style={{ width: '52px', height: '52px', borderRadius: 'var(--r-md)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--accent-light)' }}>{job.company?.[0]?.toUpperCase()}</span>
                  </div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', marginBottom: '6px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{job.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{job.company}</span>
                  <span style={{ color: 'var(--border-bright)' }}>·</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{job.location}</span>
                  <span style={{ color: 'var(--border-bright)' }}>·</span>
                  <span style={{ color: 'var(--accent-light)', fontWeight: '600' }}>{job.source}</span>
                  {job.postedAt && <><span style={{ color: 'var(--border-bright)' }}>·</span><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{job.postedAt}</span></>}
                </div>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: 'var(--text-xs)', color: 'var(--accent-light)', fontWeight: '600',
                    textDecoration: 'none', padding: '5px 12px',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--r-full)', background: 'var(--accent-dim)',
                    transition: 'all var(--duration-fast) ease',
                  }}>
                    View original posting
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
              </div>
            </div>
            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {job.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}
          </div>

          {/* ── Two-column panel ── */}
          <div className="apply-page-grid">
            {/* Left: description + template picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Job description */}
              <div className="apply-card" style={{ animationDelay: '0.05s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <p className="apply-section-label">Job Description</p>
                  <button onClick={() => setShowManualPaste(v => !v)} style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-light)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                    {showManualPaste ? 'Cancel' : 'Edit / Paste'}
                  </button>
                </div>
                {!showManualPaste && job.description && job.description.length > 20 ? (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '260px', overflowY: 'auto' }}>
                    {job.description}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      value={manualDesc}
                      onChange={e => setManualDesc(e.target.value)}
                      placeholder="Paste the full job description here for better AI accuracy…"
                      style={{
                        width: '100%', minHeight: '200px', padding: '12px 14px',
                        borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)', color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)', lineHeight: '1.65',
                        resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                        boxSizing: 'border-box', transition: 'border-color var(--duration-fast) ease',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; }}
                    />
                    <button onClick={() => { analyzeJob(job, manualDesc); setShowManualPaste(false); }} className="btn btn-primary" style={{ padding: '10px', fontSize: 'var(--text-sm)' }}>
                      Analyze Job
                    </button>
                  </div>
                )}
              </div>

              {/* Template selector */}
              <div className="apply-card" style={{ animationDelay: '0.08s' }}>
                <TemplateSelector selected={selectedTemplate} onChange={setSelectedTemplate} />
              </div>
            </div>

            {/* Right: AI score + generate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI Fit Score */}
              <div className="apply-card" style={{ animationDelay: '0.1s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <p className="apply-section-label">AI Fit Score</p>
                  {analysis && (
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '900', color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {analysis.score}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>%</span>
                    </div>
                  )}
                </div>
                {isAnalyzing ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s ${i * 0.2}s infinite` }} />
                    ))}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '6px' }}>Analyzing…</span>
                  </div>
                ) : analysis ? (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
                    <p style={{ margin: '0 0 10px' }}>{analysis.reasoning}</p>
                    <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)', color: 'var(--accent-light)', fontSize: 'var(--text-xs)' }}>
                      <strong>Strategy:</strong> {analysis.tailoringTips}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Fill in the job description to get a fit score.</p>
                )}
              </div>

              {/* Generate button */}
              <button
                onClick={generateCv}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{
                  padding: '14px', fontSize: 'var(--text-base)', fontWeight: '800',
                  opacity: isGenerating ? 0.7 : 1,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  animation: 'fadeInUp 0.35s var(--ease-out) 0.15s both',
                  width: '100%', justifyContent: 'center',
                }}
              >
                {isGenerating ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Crafting your CV…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    Generate {CV_TEMPLATES.find(t => t.id === selectedTemplate)?.name} CV
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── CV Output ── */}
          {tailoredCv && (
            <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>Your Tailored CV</h2>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  Template: <span style={{ color: 'var(--accent-light)', fontWeight: '600' }}>{CV_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
                </span>
              </div>

              {editMode ? (
                <textarea
                  value={tailoredCv}
                  onChange={e => setTailoredCv(e.target.value)}
                  style={{
                    width: '100%', minHeight: '500px', padding: '20px',
                    borderRadius: 'var(--r-xl)', border: '1px solid var(--border-dim)',
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    fontSize: '0.82rem', fontFamily: '"SF Mono", "Fira Code", monospace',
                    lineHeight: '1.7', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div ref={cvPreviewRef} style={{ width: '100%' }}>
                  <div style={{
                    position: 'relative',
                    width: `calc(210mm * ${cvScale})`,
                    height: `calc(297mm * ${cvScale})`,
                    overflow: 'hidden',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ transform: `scale(${cvScale})`, transformOrigin: 'top left', width: '210mm', height: '297mm' }}>
                      <CvPreview markdown={tailoredCv} templateId={selectedTemplate} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Final CTA ── */}
          {tailoredCv && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center',
              padding: '24px 0', borderTop: '1px solid var(--border-dim)',
            }}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 'var(--text-base)', fontWeight: '800', textDecoration: 'none' }}>
                Apply at {job.company}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Source: {job.source} · {new Date().toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Print-only container ── */}
      <div className="print-cv-container" style={{ display: 'none' }}>
        {tailoredCv && <CvPreview markdown={tailoredCv} templateId={selectedTemplate} />}
      </div>
    </>
  );
}
