'use client';

import { MARKETS, MarketId } from '@/lib/markets';

interface Props {
  value: MarketId;
  onChange: (id: MarketId) => void;
}

export default function MarketSelector({ value, onChange }: Props) {
  const current = MARKETS.find(m => m.id === value) ?? MARKETS[0];

  return (
    <div style={{ padding: '0 12px', marginBottom: '12px' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0 2px', marginBottom: '6px' }}>
        Target Market
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {MARKETS.map(m => {
          const active = m.id === value;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--r-md)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: active ? '1px solid var(--border-accent)' : '1px solid transparent',
                color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontWeight: active ? '600' : '400',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--duration-fast) ease',
                width: '100%',
              }}
            >
              <span style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                {m.flags.slice(0, 3).map((f, i) => (
                  <span key={i} style={{ fontSize: '0.8rem', lineHeight: 1 }}>{f}</span>
                ))}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.label}
              </span>
              {active && (
                <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
