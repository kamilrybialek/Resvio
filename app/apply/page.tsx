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

// (color palettes are inline per-renderer below)

// ─────────────────────────────────────────────
// RENDERER 1 — Classic (Oscar Sun template)
// Two-column: narrow section labels left / content right
// ─────────────────────────────────────────────
function CvMinimal({ markdown }: { markdown: string }) {
  const cv = parseMarkdownCv(markdown);

  const renderSection = (section: CvSection) => {
    const key = section.title.toLowerCase();
    const isRole = key.includes('experience') || key.includes('education');
    const roles = isRole ? parseRoles(section.lines) : [];

    return (
      <div style={{ display: 'flex', borderTop: '1px solid #e0e0e0', paddingTop: '16px', marginBottom: '16px' }}>
        {/* Left: section label */}
        <div style={{ width: '100px', flexShrink: 0, paddingRight: '12px', paddingTop: '2px' }}>
          <span style={{
            fontSize: '8pt', fontWeight: '700', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#444',
          }}>
            {section.title.replace('PROFESSIONAL ', '')}
          </span>
        </div>

        {/* Right: content */}
        <div style={{ flex: 1 }}>
          {isRole && roles.length > 0 ? (
            roles.map((role, ri) => (
              <div key={ri} style={{ marginBottom: ri < roles.length - 1 ? '16px' : 0 }}>
                {role.dates && (
                  <div style={{ fontSize: '9pt', color: '#999', marginBottom: '3px' }}>{role.dates}</div>
                )}
                <div style={{ fontSize: '11pt', fontWeight: '700', color: '#111', lineHeight: 1.25 }}>
                  {role.company || role.title}
                </div>
                {role.company && role.title && (
                  <div style={{ fontSize: '10pt', color: '#666', fontStyle: 'italic', margin: '3px 0 6px' }}>
                    {role.title}{role.location ? ` · ${role.location}` : ''}
                  </div>
                )}
                {role.bullets.map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', gap: '8px', fontSize: '10pt', color: '#444', margin: '4px 0', alignItems: 'flex-start', lineHeight: '1.6' }}>
                    <span style={{ flexShrink: 0, marginTop: '1px', color: '#bbb' }}>–</span>
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
                  <div key={li} style={{ marginBottom: '11px' }}>
                    <div style={{ fontSize: '11pt', fontWeight: '700', color: '#111' }}>{parts[0]}</div>
                    {parts[1] && <div style={{ fontSize: '10pt', color: '#666' }}>{parts[1]}{parts[2] ? ` · ${parts[2]}` : ''}</div>}
                  </div>
                );
              }
              if (t.startsWith('- ') || t.startsWith('• ')) {
                return (
                  <div key={li} style={{ display: 'flex', gap: '8px', fontSize: '10pt', color: '#444', margin: '4px 0', alignItems: 'flex-start', lineHeight: '1.6' }}>
                    <span style={{ flexShrink: 0, color: '#bbb' }}>–</span>
                    <span dangerouslySetInnerHTML={{ __html: inlineRender(t.slice(2)) }} />
                  </div>
                );
              }
              return (
                <p key={li} style={{ fontSize: '10pt', color: '#555', margin: '0 0 5px', lineHeight: '1.7' }}
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
      width: '210mm', minHeight: '297mm',
      background: '#ffffff',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#1a1a1a', lineHeight: 1.5,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 60px rgba(0,0,0,0.18)',
    }}>
      {/* Header */}
      <div style={{ padding: '14mm 18mm 12mm', flexShrink: 0 }}>
        <h1 style={{ fontSize: '26pt', fontWeight: '800', margin: '0 0 6px', color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {cv.name}
        </h1>
        {cv.jobTitle && (
          <p style={{ fontSize: '12pt', color: '#777', fontWeight: '400', margin: '0 0 10px' }}>{cv.jobTitle}</p>
        )}
        {cv.contact.length > 0 && (
          <div style={{ fontSize: '10pt', color: '#888', lineHeight: 1.8 }}>
            {cv.contact.join('  ·  ')}
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ flex: 1, padding: '0 18mm 10mm' }}>
        {cv.allSections.map((s, i) => <React.Fragment key={i}>{renderSection(s)}</React.Fragment>)}
      </div>

      {cv.gdpr && (
        <div style={{ padding: '4mm 18mm 6mm', borderTop: '1px solid #ebebeb', flexShrink: 0 }}>
          <p style={{ fontSize: '7.5pt', color: '#bbb', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 2 — Elegant (Emma Woodhouse template)
// Left sidebar: photo + skills + contact
// Right main: CV label + name + content
// ─────────────────────────────────────────────
function CvNordic({ markdown, photo }: { markdown: string; photo?: string }) {
  const cv = parseMarkdownCv(markdown);
  const initials = cv.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      fontSize: '8pt', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase', color: '#222',
      borderBottom: '1.5px solid #222',
      paddingBottom: '6px', marginBottom: '12px',
    }}>
      {title}
    </div>
  );

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm',
      display: 'flex', flexDirection: 'row',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      background: '#ffffff',
      boxShadow: '0 8px 60px rgba(0,0,0,0.18)',
    }}>
      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: '62mm', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14mm 10mm 14mm',
        background: '#f5f5f5',
        borderRight: '1px solid #e4e4e4',
      }}>
        {/* Photo / avatar */}
        <div style={{
          width: '96px', height: '116px',
          background: '#d4d4d4',
          marginBottom: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22pt', fontWeight: '700', color: '#999',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {photo
            ? <img src={photo} alt={cv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
          }
        </div>

        {/* Skill / sidebar sections */}
        {cv.sidebarSections.map((section, si) => (
          <div key={si} style={{ width: '100%', marginBottom: '20px' }}>
            <SectionHeader title={section.title} />
            {section.lines.map((line, li) => {
              const t = line.trim();
              if (!t) return null;
              if (t.startsWith('### ')) {
                return (
                  <p key={li} style={{ fontSize: '10pt', fontWeight: '600', color: '#333', margin: '9px 0 4px', textAlign: 'center' }}>
                    {t.replace(/^###\s*/, '')}
                  </p>
                );
              }
              if (t.startsWith('- ') || t.startsWith('• ')) {
                return (
                  <p key={li} style={{ fontSize: '9.5pt', color: '#555', margin: '5px 0', lineHeight: '1.5', textAlign: 'center' }}>
                    {t.replace(/^[-•]\s*/, '')}
                  </p>
                );
              }
              return (
                <p key={li} style={{ fontSize: '9.5pt', color: '#666', margin: '4px 0', lineHeight: '1.5', textAlign: 'center' }}
                  dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
              );
            })}
          </div>
        ))}

        {/* Contact — pushed to bottom */}
        {cv.contact.length > 0 && (
          <div style={{ width: '100%', marginTop: 'auto' }}>
            <SectionHeader title="Contact" />
            {cv.contact.map((c, i) => (
              <p key={i} style={{ fontSize: '9.5pt', color: '#555', margin: '5px 0', wordBreak: 'break-all', textAlign: 'center', lineHeight: '1.5' }}>{c}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div style={{ flex: 1, padding: '12mm 13mm 14mm 13mm', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* "CV" label — top right corner */}
        <div style={{
          position: 'absolute', top: '10mm', right: '11mm',
          background: '#111', color: '#fff',
          fontSize: '8pt', fontWeight: '700', letterSpacing: '0.12em',
          padding: '4px 10px', flexShrink: 0,
        }}>
          CV
        </div>

        {/* Name block */}
        <div style={{ marginBottom: '16px', paddingTop: '2mm' }}>
          <h1 style={{
            fontSize: '22pt', fontWeight: '800', color: '#111',
            margin: '0 0 8px', letterSpacing: '0.04em',
            textTransform: 'uppercase', lineHeight: 1,
          }}>
            {cv.name}
          </h1>
          <div style={{ width: '40px', height: '2px', background: '#111', marginBottom: '10px' }} />
          {cv.jobTitle && (
            <p style={{ fontSize: '11pt', color: '#666', margin: 0, lineHeight: 1.4 }}>{cv.jobTitle}</p>
          )}
        </div>

        {/* Main sections */}
        {cv.mainSections.map((section, si) => {
          const key = section.title.toLowerCase();
          const isRole = key.includes('experience') || key.includes('education');
          const roles = isRole ? parseRoles(section.lines) : [];

          return (
            <div key={si} style={{ marginBottom: '18px' }}>
              <SectionHeader title={section.title} />

              {isRole && roles.length > 0 ? (
                roles.map((role, ri) => (
                  <div key={ri} style={{ marginBottom: ri < roles.length - 1 ? '13px' : 0, display: 'flex', gap: '14px' }}>
                    {role.dates && (
                      <div style={{ fontSize: '9pt', color: '#999', flexShrink: 0, minWidth: '72px', lineHeight: 1.5, paddingTop: '2px' }}>
                        {role.dates.replace(/\s*[-–]\s*/, ' → ')}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10.5pt', color: '#333', margin: '0 0 4px', lineHeight: 1.4 }}>
                        {role.title && <span style={{ fontWeight: '700', color: '#111' }}>{role.title}</span>}
                        {role.title && role.company && <span style={{ color: '#bbb', margin: '0 5px' }}>·</span>}
                        {role.company && <span style={{ color: '#666' }}>{role.company}</span>}
                        {role.location && <span style={{ color: '#aaa' }}>, {role.location}</span>}
                      </div>
                      {role.bullets.map((b, bi) => (
                        <p key={bi} style={{ fontSize: '10pt', color: '#555', margin: '4px 0', lineHeight: '1.6' }}
                          dangerouslySetInnerHTML={{ __html: inlineRender(b) }} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                section.lines.map((raw, li) => {
                  const t = raw.trim();
                  if (!t) return null;
                  if (t.startsWith('- ') || t.startsWith('• ')) {
                    return (
                      <p key={li} style={{ fontSize: '10pt', color: '#555', margin: '4px 0', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: inlineRender(t.slice(2)) }} />
                    );
                  }
                  return (
                    <p key={li} style={{ fontSize: '10pt', color: '#444', margin: '0 0 6px', lineHeight: '1.7' }}
                      dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />
                  );
                })
              )}
            </div>
          );
        })}

        {cv.gdpr && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid #e8e8e8', paddingTop: '7px' }}>
            <p style={{ fontSize: '7.5pt', color: '#bbb', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RENDERER 3 — Grid (Mary Smith template)
// Thin-border grid: header | profile | edu/exp | skills
// ─────────────────────────────────────────────
function CvGrid({ markdown, photo }: { markdown: string; photo?: string }) {
  const cv = parseMarkdownCv(markdown);
  const initials = cv.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  const findSec = (kw: string) => cv.allSections.find(s => s.title.toLowerCase().includes(kw.toLowerCase()));
  const summary   = findSec('summary') || findSec('profile') || findSec('about');
  const experience = findSec('experience');
  const education  = findSec('education');
  const skills     = findSec('skill');
  const languages  = findSec('language');

  const expRoles = experience ? parseRoles(experience.lines) : [];
  const eduRoles = education  ? parseRoles(education.lines)  : [];

  // Parse skill items — split comma-separated or bullet lines
  const allSkillLines = (skills?.lines || []).concat(languages?.lines || []);
  const skillItems: string[] = allSkillLines
    .flatMap(l => l.split(/[,;]/).map(s => s.trim().replace(/^[-•]\s*/, '')))
    .filter(Boolean)
    .slice(0, 12);

  // Soft skills — from other sections or language lines
  const softSkills: string[] = (languages?.lines || [])
    .map(l => l.trim().replace(/^[-•]\s*/, ''))
    .filter(Boolean);

  const BORDER = '1px solid #d4d4d4';

  const GridSecHeader = ({ title, blue }: { title: string; blue?: boolean }) => (
    <div style={{
      fontSize: '8pt', fontWeight: '700', letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: blue ? '#2563eb' : '#222',
      marginBottom: '13px',
    }}>
      {title}
    </div>
  );

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', maxHeight: '297mm',
      background: '#ffffff', overflow: 'hidden',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#1a1a1a',
      display: 'flex', flexDirection: 'column',
      border: BORDER,
      boxShadow: '0 8px 60px rgba(0,0,0,0.18)',
    }}>

      {/* ── ROW 1: Header ── */}
      <div style={{ display: 'flex', borderBottom: BORDER, flexShrink: 0 }}>
        <div style={{ width: '50%', borderRight: BORDER, padding: '7mm 8mm' }}>
          <span style={{ fontSize: '8pt', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#444' }}>
            Resume
          </span>
        </div>
        <div style={{ flex: 1, padding: '7mm 8mm', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {cv.contact.map((c, i) => (
            <span key={i} style={{ fontSize: '9pt', color: '#666' }}>
              {c}{i < cv.contact.length - 1 ? <span style={{ color: '#ccc', margin: '0 4px' }}>/</span> : ''}
            </span>
          ))}
        </div>
      </div>

      {/* ── ROW 2: Profile (photo | name + bio) ── */}
      <div style={{ display: 'flex', borderBottom: BORDER, flexShrink: 0 }}>
        {/* Photo */}
        <div style={{ width: '50%', borderRight: BORDER, padding: '9mm', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '130px' }}>
          <div style={{
            width: '105px', height: '125px',
            background: '#e4e4e4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22pt', fontWeight: '700', color: '#aaa',
            overflow: 'hidden',
          }}>
            {photo
              ? <img src={photo} alt={cv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
        </div>
        {/* Name + bio */}
        <div style={{ flex: 1, padding: '9mm 9mm' }}>
          {cv.jobTitle && (
            <p style={{ fontSize: '9pt', color: '#999', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cv.jobTitle}
            </p>
          )}
          <div style={{ width: '40px', height: '1px', background: '#bbb', marginBottom: '9px' }} />
          <h1 style={{ fontSize: '22pt', fontWeight: '800', color: '#111', margin: '0 0 11px', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {cv.name.toUpperCase()}
          </h1>
          {summary && (
            <p style={{ fontSize: '10pt', color: '#666', margin: 0, lineHeight: '1.7' }}>
              {summary.lines.filter(l => l.trim()).map(l => l.trim().replace(/^[-•]\s*/, '')).join(' ')}
            </p>
          )}
        </div>
      </div>

      {/* ── ROW 3: Education | Experience ── */}
      <div style={{ display: 'flex', borderBottom: BORDER, flex: 1 }}>
        {/* Education */}
        <div style={{ width: '50%', borderRight: BORDER, padding: '8mm 9mm' }}>
          <GridSecHeader title="Education" />
          {eduRoles.length > 0 ? eduRoles.map((r, ri) => (
            <div key={ri} style={{ marginBottom: '13px' }}>
              {r.dates && <p style={{ fontSize: '9pt', color: '#999', margin: '0 0 2px' }}>{r.dates}</p>}
              <p style={{ fontSize: '10.5pt', fontWeight: '600', color: '#111', margin: '0 0 2px', lineHeight: 1.3 }}>
                {r.title || r.company}
              </p>
              {r.title && r.company && <p style={{ fontSize: '10pt', color: '#666', margin: '0 0 1px' }}>{r.company}</p>}
              {r.location && <p style={{ fontSize: '9.5pt', color: '#999', margin: 0 }}>{r.location}</p>}
            </div>
          )) : education?.lines.filter(l => l.trim()).map((line, li) => {
            const t = line.trim();
            if (t.startsWith('### ')) {
              const parts = t.slice(4).split('|').map(s => s.trim());
              return (
                <div key={li} style={{ marginBottom: '11px' }}>
                  <p style={{ fontSize: '10.5pt', fontWeight: '600', margin: '0 0 2px', lineHeight: 1.3 }}>{parts[0]}</p>
                  {parts[1] && <p style={{ fontSize: '10pt', color: '#666', margin: 0 }}>{parts[1]}{parts[2] ? ` · ${parts[2]}` : ''}</p>}
                </div>
              );
            }
            return <p key={li} style={{ fontSize: '10pt', color: '#666', margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: inlineRender(t) }} />;
          })}
        </div>

        {/* Experience */}
        <div style={{ flex: 1, padding: '8mm 9mm' }}>
          <GridSecHeader title="Experience" />
          {expRoles.map((role, ri) => (
            <div key={ri} style={{ marginBottom: '13px' }}>
              {role.dates && <p style={{ fontSize: '9pt', color: '#999', margin: '0 0 3px' }}>{role.dates}</p>}
              <p style={{ fontSize: '10.5pt', color: '#333', margin: '0 0 4px', lineHeight: 1.3 }}>
                {role.title && <span style={{ fontWeight: '700', color: '#111' }}>{role.title}</span>}
                {role.title && role.company && <span style={{ color: '#ccc', margin: '0 5px' }}>/</span>}
                {role.company && <span style={{ fontWeight: '500' }}>{role.company}</span>}
              </p>
              {role.bullets.map((b, bi) => (
                <p key={bi} style={{ fontSize: '10pt', color: '#555', margin: '4px 0', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: inlineRender(b) }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 4: Skills (dots) | Professional | Social ── */}
      <div style={{ display: 'flex', borderBottom: BORDER, flexShrink: 0 }}>
        {/* Skills with dot ratings */}
        <div style={{ width: '33.33%', borderRight: BORDER, padding: '7mm 9mm' }}>
          <GridSecHeader title="Skills" />
          {skillItems.slice(0, 7).map((skill, si) => {
            const dots = Math.max(5 - si, 2);
            return (
              <div key={si} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 0' }}>
                <span style={{ fontSize: '10pt', color: '#444' }}>{skill}</span>
                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                  {[1,2,3,4,5].map(d => (
                    <div key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: d <= dots ? '#222' : '#ddd' }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Professional skills */}
        <div style={{ width: '33.33%', borderRight: BORDER, padding: '7mm 9mm' }}>
          <GridSecHeader title="Professional" blue />
          {skillItems.slice(0, 7).map((skill, si) => (
            <p key={si} style={{ fontSize: '10pt', color: '#555', margin: '6px 0' }}>{skill}</p>
          ))}
        </div>

        {/* Social / soft skills */}
        <div style={{ flex: 1, padding: '7mm 9mm' }}>
          <GridSecHeader title="Social" blue />
          {(softSkills.length > 0 ? softSkills : skillItems.slice(5)).slice(0, 7).map((skill, si) => (
            <p key={si} style={{ fontSize: '10pt', color: '#555', margin: '6px 0' }}>{skill}</p>
          ))}
        </div>
      </div>

      {cv.gdpr && (
        <div style={{ padding: '4mm 8mm', flexShrink: 0 }}>
          <p style={{ fontSize: '7pt', color: '#bbb', fontStyle: 'italic', margin: 0 }}>{cv.gdpr}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CV Preview dispatcher
// ─────────────────────────────────────────────
function CvPreview({ markdown, templateId, photo }: { markdown: string; templateId: TemplateId; photo?: string }) {
  if (templateId === 'minimal') return <CvMinimal markdown={markdown} />;
  if (templateId === 'grid') return <CvGrid markdown={markdown} photo={photo} />;
  return <CvNordic markdown={markdown} photo={photo} />;
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
  const [cvLanguage, setCvLanguage] = useState('English');
  const [profilePhoto, setProfilePhoto] = useState('');

  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const [cvScale, setCvScale] = useState(1);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Cover letter state
  const [coverLetter, setCoverLetter]         = useState('');
  const [isGeneratingCL, setIsGeneratingCL]   = useState(false);
  const [clError, setClError]                 = useState('');
  const [clLanguage, setClLanguage]           = useState('English');
  const [showCLSection, setShowCLSection]     = useState(false);
  const [isDownloadingCL, setIsDownloadingCL] = useState(false);
  const clPreviewRef = useRef<HTMLDivElement>(null);

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
    // Load profile photo
    fetch('/api/profile').then(r => r.json()).then(p => {
      if (p?.photoBase64) setProfilePhoto(p.photoBase64);
    }).catch(() => {});
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
        body: JSON.stringify({ job, manualDescription: manualDesc || undefined, templateId: selectedTemplate, targetLanguage: cvLanguage }),
      });
      const data = await res.json();
      setTailoredCv(data.error ? '# Error\n\n' + data.error : data.tailoredCv);
      if (!data.error) {
        setClLanguage(cvLanguage); // keep language in sync
        setShowCLSection(true);   // suggest cover letter after CV
      }
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

  const generateCoverLetter = async () => {
    if (!job) return;
    setIsGeneratingCL(true);
    setClError('');
    setCoverLetter('');
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          jobDescription: manualDesc || job.description,
          targetLanguage: clLanguage,
        }),
      });
      const data = await res.json();
      if (data.error) setClError(data.error);
      else setCoverLetter(data.letter || '');
    } catch {
      setClError('Could not connect to AI service.');
    }
    setIsGeneratingCL(false);
  };

  const downloadCoverLetterPdf = async () => {
    if (!clPreviewRef.current) return;
    setIsDownloadingCL(true);
    try {
      const html = clPreviewRef.current.innerHTML;
      const res = await fetch('/api/cv-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: `CoverLetter_${job?.company || 'Application'}.pdf` }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CoverLetter_${job?.company || 'Application'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch { window.print(); }
    setIsDownloadingCL(false);
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
              Res<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vio</span>
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

              {/* Language selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-dim)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', flexShrink: 0 }}>CV Language:</span>
                <select
                  value={cvLanguage}
                  onChange={e => setCvLanguage(e.target.value)}
                  style={{
                    flex: 1, padding: '4px 8px', borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  {['English','Swedish','Norwegian','Danish','German','Polish','French','Spanish','Dutch'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
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
                      <CvPreview markdown={tailoredCv} templateId={selectedTemplate} photo={profilePhoto || undefined} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cover Letter Section (shown after CV generation) ── */}
          {showCLSection && tailoredCv && (
            <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--r-xl)',
                overflow: 'hidden',
              }}>
                {/* Section header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border-dim)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                  background: 'linear-gradient(90deg, var(--bg-elevated), var(--bg-surface))',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--r-md)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Cover Letter</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Complete your application with a tailored cover letter</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Language selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      <select value={clLanguage} onChange={e => setClLanguage(e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none' }}>
                        {['English','Swedish','Norwegian','Danish','German','Polish','French','Spanish','Dutch'].map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    {coverLetter && (
                      <button onClick={downloadCoverLetterPdf} disabled={isDownloadingCL}
                        className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)', opacity: isDownloadingCL ? 0.7 : 1 }}>
                        {isDownloadingCL
                          ? <span style={{ width: '11px', height: '11px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        }
                        <span>Download PDF</span>
                      </button>
                    )}
                    <button onClick={generateCoverLetter} disabled={isGeneratingCL}
                      className="btn btn-primary" style={{ padding: '6px 18px', fontSize: 'var(--text-xs)', fontWeight: '800', opacity: isGeneratingCL ? 0.7 : 1 }}>
                      {isGeneratingCL
                        ? <><div style={{ width: '11px', height: '11px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Writing…</>
                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>{coverLetter ? 'Regenerate' : 'Generate Cover Letter'}</>
                      }
                    </button>
                  </div>
                </div>

                {/* Letter output */}
                <div style={{ padding: '24px' }}>
                  {clError && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', color: '#f87171', marginBottom: '16px' }}>
                      {clError}
                    </div>
                  )}
                  {isGeneratingCL && !coverLetter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-tertiary)', padding: '20px 0' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                      Writing your cover letter…
                    </div>
                  )}
                  {coverLetter ? (
                    /* Print-ready letter preview */
                    <div ref={clPreviewRef}>
                      <div style={{
                        fontFamily: '"Georgia", "Times New Roman", serif',
                        fontSize: '11pt', lineHeight: '1.85', color: '#111',
                        background: '#fff',
                        padding: '24px 28px',
                        border: '1px solid var(--border-dim)',
                        borderRadius: 'var(--r-lg)',
                        maxWidth: '680px',
                        margin: '0 auto',
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{coverLetter}</div>
                      </div>
                    </div>
                  ) : !isGeneratingCL && (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                      Click <strong>Generate Cover Letter</strong> to create a personalised letter based on your CV and this job.
                    </div>
                  )}
                </div>
              </div>
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

      {/* ── Print-only CV container ── */}
      <div className="print-cv-container" style={{ display: 'none' }}>
        {tailoredCv && <CvPreview markdown={tailoredCv} templateId={selectedTemplate} photo={profilePhoto || undefined} />}
      </div>
    </>
  );
}
