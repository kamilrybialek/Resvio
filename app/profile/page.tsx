'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', baseCv: '', portfolio: '', skills: [] as string[] });
  const [skillInput, setSkillInput] = useState('');
  const [isSaving, setIsSaving]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (data?.name || data?.baseCv || data?.baseCvPath) {
        setProfile({
          name: data.name || '', email: data.email || '',
          phone: data.phone || '', baseCv: data.baseCv || data.baseCvPath || '',
          portfolio: data.portfolioUrl || data.portfolio || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save profile'); }
    finally { setIsSaving(false); }
  };

  return (
    <>
      <style>{`
        .profile-main {
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          background: var(--bg-base);
        }
        .profile-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mobile-profile-bar { display: none; }
        .profile-sidebar-overlay { display: none; }

        @media (max-width: 900px) {
          .profile-main   { margin-left: 0 !important; padding-top: 56px !important; }
          .profile-sidebar { transform: translateX(-100%); transition: transform 0.28s var(--ease-out); }
          .profile-sidebar.open { transform: translateX(0); }
          .mobile-profile-bar { display: flex !important; }
          .profile-sidebar-overlay { display: block !important; }
          .profile-form-grid { grid-template-columns: 1fr !important; }
        }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: var(--text-xs); font-weight: 700; color: var(--text-tertiary); letter-spacing: 0.06em; text-transform: uppercase; }
        .field-input {
          padding: 11px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          color: var(--text-primary);
          font-size: var(--text-base);
          outline: none;
          transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
          width: 100%;
        }
        .field-input::placeholder { color: var(--text-tertiary); }
        .field-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .cv-toolbar-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: var(--r-full);
          font-size: var(--text-xs); font-weight: 600;
          cursor: pointer; transition: all var(--duration-fast) ease;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
        }
        .cv-toolbar-btn:hover { border-color: var(--border-bright); color: var(--text-primary); }
      `}</style>

      {/* ── Mobile top bar ── */}
      <div className="mobile-profile-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: '56px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-dim)',
        alignItems: 'center', padding: '0 16px', gap: '12px',
        backdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            width: '36px', height: '36px', borderRadius: 'var(--r-md)',
            background: sidebarOpen ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {sidebarOpen
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
        <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>
          Apply<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>arr</span>
        </span>
      </div>

      {sidebarOpen && (
        <div className="profile-sidebar-overlay" onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 140, backdropFilter: 'blur(4px)' }} />
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div className={`profile-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 150, height: '100vh' }}>
          <Sidebar />
        </div>

        <main className="profile-main" style={{ flex: 1 }}>

          {/* ── Page header ── */}
          <div style={{
            padding: '40px 40px 32px',
            background: `linear-gradient(180deg, var(--bg-surface) 0%, transparent 100%)`,
            borderBottom: '1px solid var(--border-dim)',
            marginBottom: '32px',
          }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '900', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Profile <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>& CV</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              Your information powers the AI — better profile = better matches and CVs.
            </p>
          </div>

          <div style={{ padding: '0 40px 60px', maxWidth: '840px' }}>

            {/* ── Personal details card ── */}
            <section style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-xl)',
              padding: '28px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-md)', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>Personal Details</h2>
              </div>

              <div className="profile-form-grid">
                <FieldGroup label="Full Name" value={profile.name}      onChange={v => setProfile({ ...profile, name: v })}      placeholder="Anna Kowalska" />
                <FieldGroup label="Email"     value={profile.email}     onChange={v => setProfile({ ...profile, email: v })}     placeholder="anna@example.com" />
                <FieldGroup label="Phone"     value={profile.phone}     onChange={v => setProfile({ ...profile, phone: v })}     placeholder="+46 70 123 45 67" />
                <FieldGroup label="Portfolio / LinkedIn URL" value={profile.portfolio} onChange={v => setProfile({ ...profile, portfolio: v })} placeholder="https://linkedin.com/in/..." />
              </div>
            </section>

            {/* ── Skills card ── */}
            <section style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-xl)',
              padding: '28px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>Skills</h2>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Used for AI match scoring — be specific (e.g. "React", "Figma", "Python")
                  </p>
                </div>
              </div>

              {/* Tag cloud */}
              {profile.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {profile.skills.map((skill, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px',
                      background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
                      borderRadius: 'var(--r-full)',
                      fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--accent-light)',
                    }}>
                      {skill}
                      <button
                        onClick={() => setProfile(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', fontSize: '0.65rem', padding: 0, lineHeight: 1, opacity: 0.7 }}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add skill input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                      e.preventDefault();
                      const s = skillInput.trim().replace(/,$/, '');
                      if (s && !profile.skills.includes(s)) {
                        setProfile(p => ({ ...p, skills: [...p.skills, s] }));
                      }
                      setSkillInput('');
                    }
                  }}
                  placeholder="Type a skill and press Enter (e.g. React, Figma, SQL…)"
                  className="field-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => {
                    const s = skillInput.trim();
                    if (s && !profile.skills.includes(s)) {
                      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
                    }
                    setSkillInput('');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: 'var(--text-sm)', flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
              {profile.skills.length === 0 && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '10px' }}>
                  No skills added yet. Add at least 5–10 core skills to improve AI scoring accuracy.
                </p>
              )}
            </section>

            {/* ── Base CV card ── */}
            <section style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-xl)',
              padding: '28px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--r-md)', background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', color: 'var(--text-primary)' }}>Base CV</h2>
                </div>

                {/* Import buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="cv-toolbar-btn"
                    onClick={async () => {
                      const url = prompt('Enter your LinkedIn Profile URL:');
                      if (!url) return;
                      setIsSaving(true);
                      try {
                        const res = await fetch('/api/parse-linkedin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
                        const data = await res.json();
                        if (data.text) setProfile({ ...profile, baseCv: data.text });
                        else alert(data.error);
                      } catch { alert('Error scraping LinkedIn'); }
                      finally { setIsSaving(false); }
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                    </svg>
                    LinkedIn
                  </button>

                  <div>
                    <input type="file" id="cv-upload" accept="application/pdf" style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsSaving(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/parse-cv', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.text) {
                            const updated = { ...profile, baseCv: data.text };
                            setProfile(updated);
                            await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                            setSaved(true);
                            setTimeout(() => setSaved(false), 2000);
                          } else { alert('Error: ' + (data.error || 'Failed to parse PDF')); }
                        } catch { alert('Error uploading PDF'); }
                        finally { setIsSaving(false); e.target.value = ''; }
                      }}
                    />
                    <label htmlFor="cv-upload" className="cv-toolbar-btn" style={{ cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Import PDF
                    </label>
                  </div>
                </div>
              </div>

              <textarea
                value={profile.baseCv}
                onChange={e => setProfile({ ...profile, baseCv: e.target.value })}
                placeholder="Paste your CV here in plain text or Markdown, or import a PDF above. Include experience, skills, education, and languages."
                style={{
                  width: '100%', minHeight: '340px',
                  padding: '14px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem', lineHeight: '1.65',
                  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
              />
              {profile.baseCv && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                  {profile.baseCv.split(/\s+/).filter(Boolean).length} words · {profile.baseCv.length} characters
                </p>
              )}
            </section>

            {/* ── Action row ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
                style={{
                  padding: '12px 32px',
                  fontSize: 'var(--text-base)',
                  opacity: isSaving ? 0.7 : 1,
                  gap: '8px',
                }}
              >
                {saved ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Saved!
                  </>
                ) : isSaving ? 'Saving…' : 'Save Profile'}
              </button>

              <button
                onClick={async () => {
                  if (confirm('Clear all profile data and applied jobs?')) {
                    await fetch('/api/clear-db', { method: 'POST' });
                    setProfile({ name: '', email: '', phone: '', baseCv: '', portfolio: '', skills: [] });
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: 'var(--text-danger)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 'var(--r-full)',
                  fontWeight: '600', fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) ease',
                }}
              >
                Clear Database
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function FieldGroup({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </div>
  );
}
