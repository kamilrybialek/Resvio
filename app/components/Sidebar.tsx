'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="glass" style={{
      width: '240px',
      height: 'calc(100vh - 40px)',
      margin: '20px',
      padding: '1.5rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
        <div style={{
          width: '30px', height: '30px',
          background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
          borderRadius: '8px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '0.9rem',
        }}>A</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--snow)', margin: 0 }}>
          Apply<span className="premium-gradient">arr</span>
        </h1>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavItem href="/" icon="🔍" label="Job Search" active={pathname === '/'} />
        <NavItem href="/profile" icon="👤" label="Profile & CV" active={pathname === '/profile'} />
      </nav>

      {/* Bottom status */}
      <div style={{ marginTop: 'auto', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--slater)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Market</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🇸🇪</span>
          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Scandinavia</span>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.65rem 0.85rem',
      borderRadius: '10px',
      background: active ? 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))' : 'transparent',
      color: active ? 'white' : 'var(--mist)',
      fontWeight: active ? '600' : '400',
      fontSize: '0.9rem',
      textDecoration: 'none',
      transition: 'background 0.15s, color 0.15s',
    }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
