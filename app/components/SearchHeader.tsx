'use client';

import React, { useState } from 'react';

interface SearchHeaderProps {
  onSearch: (q: string, l: string, d: string) => void;
}

export default function SearchHeader({ onSearch }: SearchHeaderProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [dateFilter, setDateFilter] = useState('any');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    onSearch(query, location, dateFilter);
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

      <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '0.75rem', width: '100%' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Job title (e.g. Graphic Designer)..."
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(0,0,0,0.2)',
            color: 'var(--snow)',
            fontSize: '0.9rem',
          }}
        />

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g. Sweden)..."
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(0,0,0,0.2)',
            color: 'var(--snow)',
            fontSize: '0.9rem',
          }}
        />

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(0,0,0,0.2)',
            color: 'var(--snow)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <option value="any">Anytime</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>

        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--nordic-blue), var(--nordic-teal))',
            color: 'white',
            borderRadius: '10px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
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
