'use client';

import React, { useState } from 'react';

interface SearchHeaderProps {
  onSearch: (q: string, l: string) => void;
}

export default function SearchHeader({ onSearch }: SearchHeaderProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    onSearch(query, location);
  };

  return (
    <div className="glass" style={{
      padding: '1.5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      width: '100%',
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.2rem' }}>Search opportunities</h2>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <div style={{ flex: 2 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title (e.g. Graphic Designer, UI/UX)..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--snow)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Sweden, Stockholm, Remote)..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--snow)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
            color: 'white',
            borderRadius: '10px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </form>

      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
        <ExternalSearchLink site="LinkedIn" query={query} location={location} />
        <ExternalSearchLink site="Indeed" query={query} location={location} />
        <ExternalSearchLink site="Blocket Jobb" query={query} location={location} />
        <ExternalSearchLink site="Arbetsförmedlingen" query={query} location={location} />
      </div>
    </div>
  );
}

function ExternalSearchLink({ site, query, location }: { site: string; query: string; location: string }) {
  const getUrl = () => {
    switch (site) {
      case 'LinkedIn':
        return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      case 'Indeed':
        return `https://se.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
      case 'Blocket Jobb':
        return `https://jobb.blocket.se/lediga-jobb-i-hela-sverige/?q=${encodeURIComponent(query)}`;
      case 'Arbetsförmedlingen':
        return `https://arbetsformedlingen.se/platsbanken/annonser?q=${encodeURIComponent(query)}`;
      default:
        return '#';
    }
  };

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noreferrer"
      style={{ fontSize: '0.8rem', color: 'var(--glacier)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
    >
      <span style={{ textDecoration: 'underline' }}>Search on {site}</span>
      <span>↗</span>
    </a>
  );
}
