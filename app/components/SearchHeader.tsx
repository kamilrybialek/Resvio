'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface SearchHeaderProps {
  onSearch: (q: string, l: string, d: string) => void;
}

interface SearchPreset {
  id: string;
  query: string;
  location: string;
  dateFilter: string;
  pinned: boolean;
  lastUsed: number;
}

const DATE_FILTER_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '2h', label: 'Last 2 hours' },
  { value: '4h', label: 'Last 4 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '48h', label: 'Last 48 hours' },
  { value: '72h', label: 'Last 72 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
];

const STORAGE_KEY = 'applyarr_presets';
const MAX_RECENT = 8;

function loadPresets(): SearchPreset[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function savePresets(presets: SearchPreset[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function presetLabel(p: SearchPreset): string {
  const parts = [p.query, p.location].filter(Boolean);
  return parts.length ? parts.join(' / ') : 'Search';
}

export default function SearchHeader({ onSearch }: SearchHeaderProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('any');
  const [presets, setPresets] = useState<SearchPreset[]>([]);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const persistPresets = useCallback((updated: SearchPreset[]) => {
    setPresets(updated);
    savePresets(updated);
  }, []);

  const recordSearch = useCallback((q: string, l: string, d: string) => {
    const current = loadPresets();
    const key = `${q.toLowerCase().trim()}|${l.toLowerCase().trim()}`;

    // Check if already exists (pinned or recent)
    const existing = current.find(
      p => `${p.query.toLowerCase().trim()}|${p.location.toLowerCase().trim()}` === key
    );

    if (existing) {
      // Just update lastUsed and dateFilter
      persistPresets(
        current.map(p =>
          p.id === existing.id ? { ...p, lastUsed: Date.now(), dateFilter: d } : p
        )
      );
      return;
    }

    const newPreset: SearchPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      query: q,
      location: l,
      dateFilter: d,
      pinned: false,
      lastUsed: Date.now(),
    };

    // Keep max MAX_RECENT unpinned entries; pinned ones are always kept
    const pinned = current.filter(p => p.pinned);
    const recent = current.filter(p => !p.pinned);
    const trimmedRecent = [newPreset, ...recent].slice(0, MAX_RECENT);

    persistPresets([...pinned, ...trimmedRecent]);
  }, [persistPresets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    onSearch(query, location, dateFilter);
    recordSearch(query, location, dateFilter);
  };

  const applyPreset = (p: SearchPreset) => {
    setQuery(p.query);
    setLocation(p.location);
    setDateFilter(p.dateFilter);
    onSearch(p.query, p.location, p.dateFilter);
    persistPresets(
      presets.map(pr => pr.id === p.id ? { ...pr, lastUsed: Date.now() } : pr)
    );
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persistPresets(presets.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  const removePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persistPresets(presets.filter(p => p.id !== id));
  };

  const pinned = presets.filter(p => p.pinned).sort((a, b) => b.lastUsed - a.lastUsed);
  const recent = presets.filter(p => !p.pinned).sort((a, b) => b.lastUsed - a.lastUsed);

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--snow)',
    fontSize: '0.9rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div className="glass" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.1rem' }}>Search opportunities</h2>

      {/* Search form */}
      <form onSubmit={handleSearch}>
        <div className="search-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Job title (e.g. Service Technician)..."
            style={inputStyle}
          />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Location (e.g. Gothenburg)..."
            style={inputStyle}
          />
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {DATE_FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#161b22', color: '#f0f6fc' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
              color: 'white', borderRadius: '10px',
              fontWeight: '700', border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', fontSize: '0.9rem',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Pinned presets */}
      {pinned.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--nordic-teal)', fontWeight: '600', marginRight: '0.15rem', letterSpacing: '0.04em' }}>★ Saved</span>
          {pinned.map(p => (
            <PresetPill
              key={p.id}
              preset={p}
              onApply={() => applyPreset(p)}
              onPin={e => togglePin(p.id, e)}
              onRemove={e => removePreset(p.id, e)}
              accent
            />
          ))}
        </div>
      )}

      {/* Recent searches */}
      {recent.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--slater)', marginRight: '0.15rem' }}>Recent:</span>
          {recent.map(p => (
            <PresetPill
              key={p.id}
              preset={p}
              onApply={() => applyPreset(p)}
              onPin={e => togglePin(p.id, e)}
              onRemove={e => removePreset(p.id, e)}
              accent={false}
            />
          ))}
        </div>
      )}

      {/* Quick time filter pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--slater)', marginRight: '0.25rem' }}>Quick:</span>
        {['1h', '4h', '24h', '48h', '7d'].map(v => (
          <button
            key={v}
            onClick={() => { setDateFilter(v); if (query || location) onSearch(query, location, v); }}
            style={{
              padding: '3px 10px', borderRadius: '20px', border: 'none',
              background: dateFilter === v ? 'var(--nordic-teal)' : 'rgba(255,255,255,0.06)',
              color: dateFilter === v ? 'white' : 'var(--glacier)',
              fontSize: '0.72rem', cursor: 'pointer', fontWeight: dateFilter === v ? '600' : '400',
              transition: 'all 0.15s',
            }}
          >
            {DATE_FILTER_OPTIONS.find(o => o.value === v)?.label.replace('Last ', '')}
          </button>
        ))}
      </div>

      {/* External links */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
        <ExternalSearchLink site="LinkedIn" query={query} location={location} />
        <ExternalSearchLink site="Indeed" query={query} location={location} />
        <ExternalSearchLink site="Blocket Jobb" query={query} location={location} />
        <ExternalSearchLink site="Arbetsförmedlingen" query={query} location={location} />
        <ExternalSearchLink site="TheHub" query={query} location={location} />
      </div>

      <style>{`
        @media (max-width: 700px) {
          .search-form-grid { grid-template-columns: 1fr !important; }
        }
        .preset-pill:hover { opacity: 1 !important; filter: brightness(1.15); }
        .preset-pin:hover { color: var(--nordic-teal) !important; }
        .preset-remove:hover { color: #f87171 !important; }
      `}</style>
    </div>
  );
}

// ─── Preset pill component ────────────────────────────────
interface PresetPillProps {
  preset: SearchPreset;
  onApply: () => void;
  onPin: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  accent: boolean;
}

function PresetPill({ preset, onApply, onPin, onRemove, accent }: PresetPillProps) {
  const dateLabel = preset.dateFilter && preset.dateFilter !== 'any'
    ? ` · ${DATE_FILTER_OPTIONS.find(o => o.value === preset.dateFilter)?.label.replace('Last ', '') ?? preset.dateFilter}`
    : '';

  return (
    <div
      className="preset-pill"
      onClick={onApply}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 5px 3px 10px', borderRadius: '20px', cursor: 'pointer',
        background: accent ? 'rgba(8,145,178,0.13)' : 'rgba(255,255,255,0.06)',
        border: accent ? '1px solid rgba(8,145,178,0.35)' : '1px solid var(--glass-border)',
        fontSize: '0.72rem', color: accent ? '#67e8f9' : 'var(--mist)',
        transition: 'all 0.15s', opacity: 0.92,
        maxWidth: '220px',
        userSelect: 'none',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {presetLabel(preset)}{dateLabel}
      </span>

      {/* Pin / unpin */}
      <button
        className="preset-pin"
        onClick={onPin}
        title={preset.pinned ? 'Unpin' : 'Pin to saved'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
          color: preset.pinned ? 'var(--nordic-teal)' : 'var(--slater)',
          fontSize: '0.75rem', lineHeight: 1, flexShrink: 0,
          transition: 'color 0.15s',
        }}
      >
        {preset.pinned ? '★' : '☆'}
      </button>

      {/* Remove */}
      <button
        className="preset-remove"
        onClick={onRemove}
        title="Remove"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 3px',
          color: 'var(--slater)', fontSize: '0.65rem', lineHeight: 1, flexShrink: 0,
          transition: 'color 0.15s',
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── External search link ─────────────────────────────────
function ExternalSearchLink({ site, query, location }: { site: string; query: string; location: string }) {
  const getUrl = () => {
    switch (site) {
      case 'LinkedIn': return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      case 'Indeed': return `https://se.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
      case 'Blocket Jobb': return `https://jobb.blocket.se/lediga-jobb-i-hela-sverige/?q=${encodeURIComponent(query)}`;
      case 'Arbetsförmedlingen': return `https://arbetsformedlingen.se/platsbanken/annonser?q=${encodeURIComponent(query)}`;
      case 'TheHub': return `https://thehub.io/jobs?search=${encodeURIComponent(query)}`;
      default: return '#';
    }
  };
  return (
    <a href={getUrl()} target="_blank" rel="noreferrer" style={{ fontSize: '0.77rem', color: 'var(--glacier)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ textDecoration: 'underline' }}>{site}</span>
      <span style={{ opacity: 0.6 }}>↗</span>
    </a>
  );
}
