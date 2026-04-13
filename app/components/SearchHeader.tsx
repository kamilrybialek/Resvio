'use client';

import React, { useState } from 'react';

interface SearchHeaderProps {
  onSearch: (q: string, l: string, d: string) => void;
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

export default function SearchHeader({ onSearch }: SearchHeaderProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('any');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    onSearch(query, location, dateFilter);
  };

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

      {/* Quick filter pills for time */}
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

      {/* External search links */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
        <ExternalSearchLink site="LinkedIn" query={query} location={location} />
        <ExternalSearchLink site="Indeed" query={query} location={location} />
        <ExternalSearchLink site="Blocket Jobb" query={query} location={location} />
        <ExternalSearchLink site="Arbetsförmedlingen" query={query} location={location} />
        <ExternalSearchLink site="TheHub" query={query} location={location} />
      </div>

      <style>{`
        @media (max-width: 700px) {
          .search-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

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
