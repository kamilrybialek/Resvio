'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('l') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    router.push(`/?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  return (
    <div className="glass" style={{ 
      padding: '1.5rem 2rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      width: '100%'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Search opportunities</h2>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <div style={{ flex: 2, position: 'relative' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords (e.g. Graphic Designer, UI/UX)..." 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px', 
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--snow)',
              fontSize: '0.95rem'
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
              fontSize: '0.95rem'
            }}
          />
        </div>

        <button type="submit" style={{ 
          padding: '0.75rem 2rem', 
          background: 'var(--nordic-blue)', 
          color: 'white', 
          borderRadius: '10px',
          fontWeight: '700',
          border: 'none',
          cursor: 'pointer'
        }}>
          Search
        </button>
      </form>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <ExternalSearchLink site="LinkedIn" query={query} location={location} />
          <ExternalSearchLink site="Indeed" query={query} location={location} />
          <ExternalSearchLink site="Blocket Jobb" query={query} location={location} />
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); /* API logic */ }} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="url" 
            placeholder="Paste job URL to import..." 
            style={{ 
              padding: '0.5rem', 
              borderRadius: '6px', 
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--snow)',
              fontSize: '0.8rem',
              width: '200px'
            }} 
          />
          <button style={{ 
            padding: '0.5rem 1rem', 
            background: 'var(--glass-border)', 
            color: 'white', 
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: 'none',
            cursor: 'pointer'
          }}>
            Import Job
          </button>
        </form>
      </div>
    </div>
  );
}

function ExternalSearchLink({ site, query, location }: { site: string; query: string; location: string }) {
  const getUrl = () => {
    switch(site) {
      case 'LinkedIn': return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      case 'Indeed': return `https://se.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
      case 'Blocket Jobb': return `https://jobb.blocket.se/lediga-jobb-i-hela-sverige/?q=${encodeURIComponent(query)}`;
      default: return '#';
    }
  };

  return (
    <a href={getUrl()} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--glacier)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ textDecoration: 'underline' }}>Search on {site}</span>
      <span>↗</span>
    </a>
  );
}
