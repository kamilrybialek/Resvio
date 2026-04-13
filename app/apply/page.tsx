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
// Color palettes
// ─────────────────────────────────────────────
const M = {
  text: '#1a1a1a', muted: '#555', light: '#888',
  label: '#444', border: '#d5d5d5',
};
const N = {
  dark: '#1c2333', accent: '#b8975a', accentLight: '#d4b27a',
  text: '#1a1a2e', muted: '#5a6070', border: '#e5e5e5',
  sidebarText: '#e8e0d5', sidebarMuted: '#9ba3b0',
};
const G = {
  bg: '#f5f5f5', surface: '#ffffff', text: '#1a1a1a',
  muted: '#555', accent: '#2563eb', border: '#e0e0e0',
};

// ─────────────────────────────────────────────
// RENDERER 1 — Minimal Classic
// ─────────────────────────────────────────────
function CvMinimal({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);
  const sections = cv.allSections;

  const renderSection = (section: CvSection) => {
    const isExp = section.title.toLowerCase().includes('experience');
    const isEdu = section.title.toLowerCase().includes('education');
    const roles = (isExp || isEdu) ? parseRoles(section.lines) : [];

    const shortTitle = section.title
      .replace('PROFESSIONAL ', '')
      .replace(' & COMPETENCIES', '');

    return (
      <div style={{ display: 'flex', gap: '14px', marginBottom: '11px' }}>
        {/* Left label */}
        <div style={{ width: '82px', flexShrink: 0, paddingTop: '1px' }}>
          <span style={{
            fontSize: '5.5pt', fontWeight: '700', letterSpacing: '0.13em',
            textTransform: 'uppercase', color: M.label,
          }}>{shortTitle}</span>
        </div>
        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {(isExp || isEdu) && roles.length > 0 ? (
            roles.map((role, ri) => (
              <div key={ri} style={{ marginBottom: ri < roles.length - 1 ? '7px' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '8.5pt', fontWeight: '700', color: M.text }}>{role.company || role.title}</span>
                  <span style={{ fontSize: '6.5pt', color: M.light, flexShrink: 0 }}>{role.dates}</span>
                </div>
                {role.company && role.title && (
                  <p style={{ fontSize: '7.5pt', color: M.muted, margin: '0 0 2px', fontStyle: 'italic' }}>
                    {role.title}{role.location ? ` · ${role.location}` : ''}
                  </p>
                )}
                {!role.company && role.location && (
                  <p style={{ fontSize: '7.5pt', color: M.muted, margin: '0 0 2px' }}>{role.location}</p>
                )}
                {role.bullets.map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', gap: '5px', margin: '1px 0', fontSize: '7.5pt', color: M.text, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, color: M.muted }}>–</span>
                    <span dangerouslySetInnerHTML={{ __html: inlineRender(b) }} />
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
                  <div key={li} style={{ marginBottom: '3px' }}>
                    <span style={{ fontSize: '8pt', fontWeight: '700' }}>{parts[0]}</span>
                    {parts[1] && <span style={{ fontSize: '7.5pt', color: M.muted }}> · {parts[1]}</span>}
                    {parts[2] && <span style={{ fontSize: '7pt', color: M.light }}> · {parts[2]}</span>}
                  </div>
                );
              }
              if (t.startsWith('- ') || t.startsWith('• ')) {
                return (
                  <div key={li} style={{ display: 'flex', gap: '5px', margin: '1px 0', fontSize: '7.5pt', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, color: M.muted }}>–</span>
                    <span dangerouslySetInnerHTML={{ __html: inlineRender(t.slice(2)) }} />
                  </div>
                );
              }
              return (
                <p key={li} style={{ margin: '0 0 1px', fontSize: '8pt', color: M.text, lineHeight: '1.5' }}
                  dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      background: '#ffffff', overflow: 'hidden',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '9pt', lineHeight: '1.45', color: M.text,
      padding: '18mm 16mm 14mm', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ fontSize: '17pt', fontWeight: '800', margin: '0 0 3px', letterSpacing: '-0.5px', color: M.text }}>{cv.name}</h1>
        {cv.jobTitle && <p style={{ fontSize: '8.5pt', color: M.muted, margin: '0 0 6px' }}>{cv.jobTitle}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px', fontSize: '7pt', color: M.light }}>
          {cv.contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>
      <div style={{ height: '1px', background: M.border, margin: '6px 0 10px' }} />

      {/* Sections */}
      <div style={{ flex: 1 }}>{sections.map((s, i) => <React.Fragment key={i}>{renderSection(s)}</React.Fragment>)}</div>

      {/* GDPR */}
      {cv.gdpr && (
        <div style={{ borderTop: `1px solid ${M.border}`, paddingTop: '6px', marginTop: '4px' }}>
          <p style={{ fontSize: '6pt', color: '#aaa', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 2 — Nordic Sidebar
// ─────────────────────────────────────────────
function SidebarLine({ line }: { line: string }) {
  const t = line.trim();
  if (!t) return null;
  if (t.startsWith('### ')) {
    return <p style={{ fontWeight: '700', fontSize: '7.5pt', color: N.accent, margin: '7px 0 2px', letterSpacing: '0.04em' }}>{t.replace(/^###\s*/, '')}</p>;
  }
  if (t.startsWith('- ') || t.startsWith('• ')) {
    return (
      <div style={{ display: 'flex', gap: '5px', margin: '2px 0', fontSize: '7.5pt', color: N.sidebarText, alignItems: 'flex-start' }}>
        <span style={{ color: N.accent, flexShrink: 0, marginTop: '1pt' }}>·</span>
        <span dangerouslySetInnerHTML={{ __html: inlineRender(t.replace(/^[-•]\s*/, '')) }} />
      </div>
    );
  }
  return <p style={{ margin: '2px 0', fontSize: '7.5pt', color: N.sidebarMuted, lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />;
}

function MainLine({ line }: { line: string }) {
  const t = line.trim();
  if (!t) return null;
  if (t.startsWith('### ')) {
    return (
      <div style={{ marginTop: '8px', marginBottom: '1px' }}>
        <p style={{ margin: 0, fontSize: '8.5pt', fontWeight: '700', color: N.text }} dangerouslySetInnerHTML={{ __html: inlineRender(t.replace(/^###\s*/, '')) }} />
      </div>
    );
  }
  if (t.startsWith('- ') || t.startsWith('• ')) {
    return (
      <div style={{ display: 'flex', gap: '7px', margin: '2px 0', fontSize: '8pt', color: '#333', alignItems: 'flex-start' }}>
        <span style={{ color: N.accent, flexShrink: 0, fontSize: '9pt', lineHeight: '1.2' }}>–</span>
        <span dangerouslySetInnerHTML={{ __html: inlineRender(t.replace(/^[-•]\s*/, '')) }} />
      </div>
    );
  }
  if (t.startsWith('**') && t.endsWith('**')) {
    return <p style={{ margin: '2px 0', fontSize: '8.5pt', fontWeight: '700', color: N.text }}>{t.replace(/\*\*/g, '')}</p>;
  }
  return <p style={{ margin: '2px 0', fontSize: '8.5pt', color: N.muted, lineHeight: '1.55' }} dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />;
}

function CvNordic({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      display: 'flex', flexDirection: 'row',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '10pt', lineHeight: '1.45', background: '#ffffff',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
      overflow: 'hidden',
    }}>
      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: '64mm', minHeight: '297mm', background: N.dark,
        flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${N.accent}, ${N.accentLight})` }} />
        {/* Identity */}
        <div style={{ padding: '22px 18px 18px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '50%',
            border: `2px solid ${N.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '14px', fontSize: '14pt', fontWeight: '700', color: N.accent,
          }}>
            {cv.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <h1 style={{ fontSize: '12pt', fontWeight: '700', color: '#fff', margin: '0 0 4px', lineHeight: 1.1 }}>{cv.name}</h1>
          {cv.jobTitle && (
            <p style={{ fontSize: '7pt', color: N.accent, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>{cv.jobTitle}</p>
          )}
        </div>

        <div style={{ height: '1px', background: `linear-gradient(90deg, ${N.accent}44, transparent)`, margin: '0 18px' }} />

        {/* Contact */}
        {cv.contact.length > 0 && (
          <div style={{ padding: '14px 18px 10px' }}>
            <p style={{ fontSize: '6.5pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: N.accent, margin: '0 0 7px' }}>Contact</p>
            {cv.contact.map((c, i) => (
              <p key={i} style={{ fontSize: '7pt', color: N.sidebarText, margin: '3px 0', lineHeight: '1.4', wordBreak: 'break-all' }}>{c}</p>
            ))}
          </div>
        )}

        {/* Sidebar sections */}
        {cv.sidebarSections.map((section, si) => (
          <div key={si} style={{ padding: '10px 18px 4px' }}>
            <div style={{ height: '1px', background: `linear-gradient(90deg, ${N.accent}33, transparent)`, marginBottom: '10px' }} />
            <p style={{ fontSize: '6.5pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: N.accent, margin: '0 0 7px' }}>{section.title}</p>
            {section.lines.map((line, li) => <SidebarLine key={li} line={line} />)}
          </div>
        ))}

        <div style={{ marginTop: 'auto', height: '4px', background: `linear-gradient(90deg, transparent, ${N.accent}44)` }} />
      </div>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex: 1, padding: '26px 22px 18px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {cv.mainSections.map((section, si) => (
          <div key={si} style={{ marginBottom: '16px', pageBreakInside: 'avoid' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '6.5pt', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: N.dark, margin: 0, whiteSpace: 'nowrap' }}>
                {section.title}
              </h2>
              <div style={{ flex: 1, height: '1px', background: N.accent, opacity: 0.35 }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: N.accent, flexShrink: 0 }} />
            </div>
            <div>{section.lines.map((line, li) => <MainLine key={li} line={line} />)}</div>
          </div>
        ))}
        {cv.gdpr && (
          <div style={{ marginTop: 'auto', borderTop: `1px solid ${N.border}`, paddingTop: '8px' }}>
            <p style={{ fontSize: '6.5pt', color: '#aaa', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>{cv.gdpr}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 3 — Modern Grid
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

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      background: G.bg, overflow: 'hidden',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '8.5pt', lineHeight: '1.4', color: G.text,
      boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 60px rgba(0,0,0,0.3)',
    }}>
      {/* Header bar */}
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: '7px 16mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '6pt', fontWeight: '700', letterSpacing: '0.18em', color: G.muted, textTransform: 'uppercase' }}>Resume</span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '7pt', color: G.muted }}>
          {cv.contact.slice(0, 2).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </div>

      {/* Identity + summary */}
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: '13px 16mm', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: G.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13pt', fontWeight: '700', color: '#fff' }}>
            {cv.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {cv.jobTitle && <p style={{ fontSize: '6.5pt', color: G.muted, margin: '0 0 2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cv.jobTitle}</p>}
          <h1 style={{ fontSize: '14pt', fontWeight: '800', margin: '0 0 5px', letterSpacing: '-0.5px' }}>{cv.name}</h1>
          {summary && (
            <p style={{ fontSize: '7.5pt', color: G.muted, margin: 0, lineHeight: '1.55' }}>
              {summary.lines.filter(l => l.trim()).map(l => l.trim()).join(' ')}
            </p>
          )}
        </div>
        <div style={{ fontSize: '7pt', color: G.muted, textAlign: 'right', flexShrink: 0, maxWidth: '90px' }}>
          {cv.contact.slice(2).map((c, i) => <p key={i} style={{ margin: '1px 0', wordBreak: 'break-all' }}>{c}</p>)}
        </div>
      </div>

      {/* Education | Experience */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, borderBottom: `1px solid ${G.border}` }}>
        {/* Education */}
        <div style={{ width: '38%', borderRight: `1px solid ${G.border}`, padding: '11px 12mm 11px 16mm', overflow: 'hidden' }}>
          <p style={{ fontSize: '6pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, margin: '0 0 9px' }}>Education</p>
          {eduRoles.length > 0 ? eduRoles.map((r, ri) => (
            <div key={ri} style={{ marginBottom: '7px' }}>
              <p style={{ fontSize: '8pt', fontWeight: '700', margin: '0 0 1px' }}>{r.title}</p>
              {r.company && <p style={{ fontSize: '7.5pt', color: G.muted, margin: '0 0 1px' }}>{r.company}</p>}
              {(r.dates || r.location) && (
                <p style={{ fontSize: '7pt', color: G.muted, margin: 0 }}>{[r.dates, r.location].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          )) : education?.lines.filter(l => l.trim()).map((line, li) => {
            const t = line.trim();
            if (t.startsWith('### ')) {
              const parts = t.slice(4).split('|').map(s => s.trim());
              return (
                <div key={li} style={{ marginBottom: '5px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: '700', margin: '0 0 1px' }}>{parts[0]}</p>
                  {parts[1] && <p style={{ fontSize: '7.5pt', color: G.muted, margin: 0 }}>{parts[1]}{parts[2] ? ` · ${parts[2]}` : ''}</p>}
                </div>
              );
            }
            return <p key={li} style={{ fontSize: '7.5pt', color: G.muted, margin: '1px 0' }} dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />;
          })}
        </div>

        {/* Experience */}
        <div style={{ flex: 1, padding: '11px 16mm 11px 12mm', overflow: 'hidden' }}>
          <p style={{ fontSize: '6pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, margin: '0 0 9px' }}>Experience</p>
          {expRoles.map((role, ri) => (
            <div key={ri} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '8pt', fontWeight: '700' }}>{role.company}</span>
                <span style={{ fontSize: '6.5pt', color: G.muted, flexShrink: 0 }}>{role.dates}</span>
              </div>
              <p style={{ fontSize: '7.5pt', color: G.muted, margin: '0 0 2px', fontStyle: 'italic' }}>{role.title}{role.location ? ` · ${role.location}` : ''}</p>
              {role.bullets.slice(0, 3).map((b, bi) => (
                <div key={bi} style={{ display: 'flex', gap: '5px', margin: '1px 0', fontSize: '7.5pt', alignItems: 'flex-start' }}>
                  <span style={{ color: G.accent, flexShrink: 0, fontWeight: '700' }}>·</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineRender(b) }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Skills + Languages */}
      <div style={{ background: G.surface, padding: '9px 16mm' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {skills && (
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '6pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, margin: '0 0 4px' }}>Skills</p>
              <p style={{ fontSize: '7.5pt', color: G.text, margin: 0, lineHeight: '1.5' }}>
                {skills.lines.filter(l => l.trim()).join(' ')}
              </p>
            </div>
          )}
          {languages && (
            <div style={{ flexShrink: 0, minWidth: '100px' }}>
              <p style={{ fontSize: '6pt', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: G.accent, margin: '0 0 4px' }}>Languages</p>
              <p style={{ fontSize: '7.5pt', color: G.text, margin: 0 }}>
                {languages.lines.filter(l => l.trim()).join(', ')}
              </p>
            </div>
          )}
        </div>
        {cv.gdpr && (
          <p style={{ fontSize: '5.5pt', color: '#bbb', fontStyle: 'italic', margin: '8px 0 0', lineHeight: '1.3' }}>{cv.gdpr}</p>
        )}
      </div>
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
function TemplateSelector({ selected, onChange }: { selected: TemplateId; onChange: (id: TemplateId) => void }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slater)', marginBottom: '0.6rem' }}>
        CV Template
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CV_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: '1', minWidth: '90px',
              padding: '0.6rem 0.5rem',
              borderRadius: '10px',
              border: selected === t.id ? '1.5px solid var(--nordic-teal)' : '1px solid var(--glass-border)',
              background: selected === t.id ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.03)',
              color: selected === t.id ? '#67e8f9' : 'var(--glacier)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '2px' }}>{t.name}</div>
            <div style={{ fontSize: '0.62rem', opacity: 0.7, lineHeight: 1.3 }}>{t.tagline}</div>
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

  const scoreColor = analysis
    ? analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--night)', color: 'var(--snow)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--glacier)', marginBottom: '1.5rem' }}>No job selected. Close this tab and click "Apply Now" on a job card.</p>
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
          --glacier: #8b949e;
          --snow: #f0f6fc;
          --mist: #c9d1d9;
          --slater: #484f58;
        }
        body { margin: 0; background: var(--night); color: var(--snow); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

        .apply-page-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
        .apply-topbar-actions { display: flex; gap: 0.75rem; align-items: center; }
        .apply-job-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }

        @media (max-width: 900px) {
          .apply-page-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
        }
        @media (max-width: 600px) {
          .apply-topbar-actions { gap: 0.4rem !important; }
          .apply-topbar-actions button { font-size: 0.75rem !important; padding: 0.4rem 0.7rem !important; }
          .apply-job-header { flex-direction: column !important; align-items: flex-start !important; gap: 0.75rem !important; }
          .apply-content { padding: 1.5rem 1rem 4rem !important; }
        }

        @media print {
          .no-print, header, footer, nav, button, .card-hover { display: none !important; }
          body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; }
          .print-cv-container {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0; top: 0;
            width: 210mm; height: 297mm;
            margin: 0; padding: 0;
          }
          #cv-print-root {
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4; margin: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Screen layout ── */}
      <div className="no-print" style={{ minHeight: '100vh', background: 'var(--night)', color: 'var(--snow)', paddingBottom: '5rem' }}>

        {/* Sticky top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,12,16,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--glass-border)', padding: '0.65rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '26px', height: '26px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', borderRadius: '6px' }} />
            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--snow)', letterSpacing: '-0.02em' }}>Applyarr</span>
          </div>
          <div className="apply-topbar-actions">
            {tailoredCv && (
              <>
                <button onClick={() => setEditMode(!editMode)} className="card-hover" style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--glacier)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500' }}>
                  {editMode ? 'Preview' : 'Edit'}
                </button>
                <button onClick={() => window.print()} className="card-hover" style={{ padding: '0.45rem 1.2rem', borderRadius: '8px', background: 'var(--snow)', color: 'var(--night)', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem' }}>
                  Print to PDF
                </button>
              </>
            )}
            <button onClick={() => window.close()} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'var(--glacier)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
          </div>
        </div>

        <div className="apply-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Job Header ── */}
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="apply-job-header">
              {job.logo && <img src={job.logo} alt={job.company} style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'white', objectFit: 'contain', padding: '5px', flexShrink: 0 }} />}
              <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '0.3rem', letterSpacing: '-0.03em' }}>{job.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', color: 'var(--glacier)', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--snow)' }}>{job.company}</span>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <span>{job.location}</span>
                  <span style={{ opacity: 0.3 }}>|</span>
                  <span style={{ color: 'var(--nordic-teal)', fontWeight: '500' }}>{job.source}</span>
                </div>
              </div>
            </div>
            {job.tags && job.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {job.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#7dd3fc', fontWeight: '500' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* ── Two-column panel ── */}
          <div className="apply-page-grid">
            {/* Left: description + template picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Job description */}
              <div style={{ background: 'var(--slate)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--slater)', margin: 0 }}>The Challenge</h2>
                  <button onClick={() => setShowManualPaste(true)} style={{ fontSize: '0.72rem', color: 'var(--nordic-teal)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Edit</button>
                </div>
                {!showManualPaste && job.description && job.description.length > 20 ? (
                  <div style={{ fontSize: '0.88rem', color: 'var(--mist)', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '280px', overflowY: 'auto' }}>{job.description}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      value={manualDesc}
                      onChange={e => setManualDesc(e.target.value)}
                      placeholder="Paste the full job description here..."
                      style={{ width: '100%', minHeight: '220px', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--snow)', fontSize: '0.85rem', lineHeight: '1.6', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    <button onClick={() => { analyzeJob(job, manualDesc); setShowManualPaste(false); }} style={{ padding: '0.65rem', borderRadius: '8px', background: 'var(--nordic-teal)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Analyze
                    </button>
                  </div>
                )}
              </div>

              {/* Template selector */}
              <div style={{ background: 'var(--slate)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1.5rem', animation: 'fadeIn 0.55s ease-out' }}>
                <TemplateSelector selected={selectedTemplate} onChange={setSelectedTemplate} />
              </div>
            </div>

            {/* Right: AI score + generate */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* AI Fit Score */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '1.5rem', animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--slater)', margin: 0 }}>AI Fit Score</h2>
                  {analysis && <div style={{ fontSize: '2.2rem', fontWeight: '900', color: scoreColor, letterSpacing: '-0.05em' }}>{analysis.score}<span style={{ fontSize: '0.9rem', opacity: 0.5 }}>%</span></div>}
                </div>
                {isAnalyzing ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', background: 'var(--nordic-teal)', animation: `shimmer 1s ${i * 0.2}s infinite` }} />)}
                  </div>
                ) : analysis ? (
                  <div style={{ fontSize: '0.88rem', color: 'var(--mist)', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 0.75rem' }}>{analysis.reasoning}</p>
                    <div style={{ padding: '0.75rem', background: 'rgba(8,145,178,0.1)', borderRadius: '8px', borderLeft: '3px solid var(--nordic-teal)', color: '#67e8f9', fontSize: '0.8rem' }}>
                      <strong>Strategy:</strong> {analysis.tailoringTips}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--slater)', fontSize: '0.85rem' }}>Fill in the job description to get a score.</p>
                )}
              </div>

              {/* Generate button */}
              <button
                onClick={generateCv}
                disabled={isGenerating}
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  background: isGenerating ? 'var(--slate)' : 'linear-gradient(135deg, #1e3a8a 0%, #0e7490 100%)',
                  color: 'white', fontWeight: '800', fontSize: '1rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  animation: 'fadeIn 0.7s ease-out',
                }}
              >
                {isGenerating ? 'Crafting your CV...' : `✦ Generate ${CV_TEMPLATES.find(t => t.id === selectedTemplate)?.name || ''} CV`}
              </button>
            </div>
          </div>

          {/* ── CV Output ── */}
          {tailoredCv && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Your Tailored CV</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--slater)' }}>Template: {CV_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
              </div>

              {editMode ? (
                <textarea
                  value={tailoredCv}
                  onChange={e => setTailoredCv(e.target.value)}
                  style={{ width: '100%', minHeight: '500px', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--glass-border)', background: 'var(--slate)', color: 'var(--snow)', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.7', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div ref={cvPreviewRef} style={{ width: '100%' }}>
                  <div style={{
                    position: 'relative',
                    width: `calc(210mm * ${cvScale})`,
                    height: `calc(297mm * ${cvScale})`,
                    overflow: 'hidden',
                    borderRadius: '12px',
                    boxShadow: '0 16px 60px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{
                      transform: `scale(${cvScale})`,
                      transformOrigin: 'top left',
                      width: '210mm',
                      height: '297mm',
                    }}>
                      <CvPreview markdown={tailoredCv} templateId={selectedTemplate} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Final CTA ── */}
          {tailoredCv && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2.5rem' }}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', padding: '0.9rem 2.5rem', borderRadius: '50px', background: 'var(--snow)', color: 'var(--night)', fontWeight: '800', fontSize: '1rem', textDecoration: 'none' }}>
                Apply at {job.company} ↗
              </a>
              <p style={{ color: 'var(--slater)', fontSize: '0.8rem' }}>Source: {job.source} · {new Date().toLocaleDateString()}</p>
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
