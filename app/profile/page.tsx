'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Kamil Kowalski',
    email: 'kamil@example.se',
    phone: '',
    baseCv: '',
    portfolio: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <main style={{ 
        marginLeft: '320px', 
        padding: '3rem 5rem', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>My Profile & Base CV</h2>
          <p style={{ color: 'var(--glacier)', marginBottom: '2rem' }}>
            This information is used by the AI to analyze matches and generate tailored versions of your CV.
          </p>

          <div className="glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <InputGroup label="Full Name" value={profile.name} onChange={(v) => setProfile({...profile, name: v})} />
              <InputGroup label="Email Address" value={profile.email} onChange={(v) => setProfile({...profile, email: v})} />
              <InputGroup label="Phone Number" value={profile.phone} onChange={(v) => setProfile({...profile, phone: v})} />
              <InputGroup label="Portfolio URL" value={profile.portfolio} onChange={(v) => setProfile({...profile, portfolio: v})} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--slater)' }}>Base CV (Markdown/Text)</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={async () => {
                    const url = prompt("Enter your LinkedIn Profile URL:");
                    if (!url) return;
                    setIsSaving(true);
                    try {
                      const res = await fetch('/api/parse-linkedin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                      });
                      const data = await res.json();
                      if (data.text) {
                        setProfile({ ...profile, baseCv: data.text });
                        if (data.status === 'partial') alert(data.text); // Inform about auth wall
                      } else {
                        alert(data.error);
                      }
                    } catch (e) {
                      alert('Error scraping LinkedIn');
                    } finally {
                      setIsSaving(false);
                    }
                  }} style={{
                    padding: '0.5rem 1rem', 
                    background: 'transparent', 
                    border: '1px solid var(--glass-border)',
                    color: 'var(--snow)', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    cursor: 'pointer',
                    opacity: isSaving ? 0.5 : 1
                  }}>
                    Import LinkedIn URL
                  </button>
                  
                  <div>
                    <input type="file" id="cv-upload" accept="application/pdf" style={{ display: 'none' }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsSaving(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/parse-cv', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.text) {
                          setProfile({ ...profile, baseCv: data.text });
                        } else {
                          alert(data.error || 'Failed to parse PDF');
                        }
                      } catch (err) {
                        alert('Error uploading PDF');
                      } finally {
                        setIsSaving(false);
                        e.target.value = ''; // reset input
                      }
                    }} />
                    <label htmlFor="cv-upload" style={{ 
                      padding: '0.5rem 1rem', 
                      background: 'var(--glass-border)', 
                      color: 'var(--snow)', 
                      borderRadius: '8px', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      opacity: isSaving ? 0.5 : 1,
                      display: 'inline-block'
                    }}>
                      Import from PDF
                    </label>
                  </div>
                </div>
              </div>
              <textarea 
                value={profile.baseCv}
                onChange={(e) => setProfile({...profile, baseCv: e.target.value})}
                placeholder="Paste your original CV here or import a PDF/LinkedIn. Include experience, skills, and education..."
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--snow)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                style={{ 
                  padding: '1rem 2rem', 
                  background: 'var(--nordic-blue)', 
                  color: 'white', 
                  borderRadius: '10px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>

              <button 
                onClick={async () => {
                  if(confirm('Are you sure you want to clear your database (profile and applied jobs)?')) {
                    await fetch('/api/clear-db', { method: 'POST' });
                    setProfile({ name: '', email: '', phone: '', baseCv: '', portfolio: '' });
                    alert('Database cleared!');
                  }
                }}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: 'transparent', 
                  color: '#ef4444', 
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Database
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--slater)' }}>{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          padding: '0.75rem 1rem', 
          borderRadius: '10px', 
          border: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.2)',
          color: 'var(--snow)',
          fontSize: '0.95rem'
        }}
      />
    </div>
  );
}
