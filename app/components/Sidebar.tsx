'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="glass" style={{ 
      width: '280px', 
      height: 'calc(100vh - 40px)', 
      margin: '20px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      position: 'fixed'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'var(--nordic-blue)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white'
        }}>A</div>
        <Link href="/">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--snow)' }}>
            Apply<span className="premium-gradient">arr</span>
          </h1>
        </Link>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavItem href="/" icon="🏠" label="Dashboard" active={pathname === '/'} />
        <NavItem href="/?q=UI+Designer" icon="🔍" label="Job Search" />
        <NavItem href="/profile" icon="👤" label="Profile & CV" active={pathname === '/profile'} />
        <NavItem href="/settings" icon="⚙️" label="Settings" />
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--glass-border)', borderRadius: '12px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--glacier)', marginBottom: '0.5rem' }}>Active Market</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🇸🇪</span>
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Scandinavia</span>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className="card-hover" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      padding: '0.75rem 1rem', 
      borderRadius: '12px',
      background: active ? 'var(--nordic-blue)' : 'transparent',
      color: active ? 'white' : 'var(--mist)',
      cursor: 'pointer',
      fontWeight: active ? '600' : '400',
      transition: 'all 0.2s'
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
