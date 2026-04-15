'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('applyarr-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('applyarr-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '10px 12px',
        borderRadius: 'var(--r-md)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontWeight: '400',
        fontSize: 'var(--text-base)',
        cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'all var(--duration-fast) ease',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
    >
      <span style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}>
        {dark ? (
          /* Sun icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        ) : (
          /* Moon icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </span>
      {dark ? 'Light mode' : 'Dark mode'}

      {/* Toggle pill */}
      <span style={{
        marginLeft: 'auto',
        width: '32px', height: '18px',
        borderRadius: '9px',
        background: dark ? 'var(--accent)' : 'var(--border-default)',
        position: 'relative',
        transition: 'background var(--duration-base) ease',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute',
          top: '2px',
          left: dark ? '16px' : '2px',
          width: '14px', height: '14px',
          borderRadius: '50%',
          background: dark ? '#fff' : 'var(--bg-surface)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left var(--duration-base) var(--ease-out)',
        }} />
      </span>
    </button>
  );
}
