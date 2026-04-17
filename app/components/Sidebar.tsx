'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import MarketSelector from './MarketSelector';
import { MarketId } from '@/lib/markets';

const NAV = [
  {
    href: '/',
    label: 'Job Search',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/tracker',
    label: 'Tracker',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile & CV',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/cover-letter',
    label: 'Cover Letter',
    icon: (active: boolean) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  market?: MarketId;
  onMarketChange?: (id: MarketId) => void;
}

export default function Sidebar({ market = 'scandinavia', onMarketChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowY: 'auto',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '28px 20px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Res<span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vio</span>
          </span>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <p style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0 8px', marginBottom: '6px' }}>
          Menu
        </p>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '10px 12px',
                borderRadius: 'var(--r-md)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '400',
                fontSize: 'var(--text-base)',
                textDecoration: 'none',
                transition: 'all var(--duration-fast) ease',
                border: active ? '1px solid var(--border-accent)' : '1px solid transparent',
                position: 'relative',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '3px', borderRadius: '0 3px 3px 0',
                  background: 'var(--gradient-primary)',
                }} />
              )}
              <span style={{ color: active ? 'var(--accent-light)' : 'var(--text-tertiary)', display: 'flex' }}>
                {icon(active)}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Theme toggle ── */}
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <ThemeToggle />
      </div>

      {/* ── Market selector ── */}
      {onMarketChange && (
        <MarketSelector value={market} onChange={onMarketChange} />
      )}

      {/* ── Bottom divider + version ── */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border-dim)' }}>
        <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Resvio · AI-powered job search
        </p>
      </div>
    </aside>
  );
}
