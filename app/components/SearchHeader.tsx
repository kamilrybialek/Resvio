'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Autocomplete data ──────────────────────────────────────────────────────
const LOCATIONS = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping',
  'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås',
  'Södertälje', 'Eskilstuna', 'Halmstad', 'Sundsvall', 'Östersund', 'Trollhättan',
  'Oslo', 'Bergen', 'Trondheim', 'Stavanger',
  'Copenhagen', 'Aarhus', 'Odense',
  'Helsinki', 'Remote', 'Hybrid',
];

// EN keyword → adds SV synonyms to the search query
const LANG_SYNONYMS: Record<string, string[]> = {
  developer: ['utvecklare', 'programmerare'],
  engineer: ['ingenjör', 'civilingenjör'],
  designer: ['designer', 'formgivare'],
  manager: ['chef', 'ledare', 'ansvarig'],
  analyst: ['analytiker', 'analytiker'],
  architect: ['arkitekt'],
  consultant: ['konsult', 'rådgivare'],
  'data scientist': ['datavetare'],
  'product manager': ['produktchef', 'produktansvarig'],
  'project manager': ['projektledare', 'projektchef'],
  'software engineer': ['mjukvaruingenjör', 'utvecklare'],
  'frontend': ['frontend', 'frontendutvecklare'],
  'backend': ['backend', 'backendutvecklare'],
  'fullstack': ['fullstack', 'fullstackutvecklare'],
  'devops': ['devops'],
  'ux': ['ux', 'användarupplevelse'],
  'ui': ['ui', 'gränssnittsdesign'],
  'marketing': ['marknadsföring', 'marknadsförare'],
  'sales': ['sälj', 'säljare', 'försäljning'],
  'account manager': ['kundansvarig', 'kundchef'],
  'finance': ['ekonomi', 'ekonom', 'finans'],
  'accountant': ['revisor', 'ekonomiassistent', 'redovisningsekonom'],
  'hr': ['hr', 'personal', 'personalchef'],
  'recruiter': ['rekryterare', 'rekrytering'],
  'lawyer': ['jurist', 'advokat'],
  'teacher': ['lärare', 'pedagog'],
  'nurse': ['sjuksköterska'],
  'doctor': ['läkare'],
};

function addSynonyms(query: string): string {
  const q = query.toLowerCase().trim();
  const extras: string[] = [];
  for (const [en, sv] of Object.entries(LANG_SYNONYMS)) {
    if (q.includes(en)) {
      extras.push(...sv);
    }
  }
  if (extras.length === 0) return query;
  const unique = [...new Set(extras)].filter(s => !q.includes(s));
  return unique.length > 0 ? `${query} ${unique.slice(0, 2).join(' ')}` : query;
}

const JOB_TITLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'iOS Developer', 'Android Developer', 'DevOps Engineer', 'Cloud Engineer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'AI Engineer',
  'Product Manager', 'Project Manager', 'Scrum Master', 'Agile Coach',
  'UX Designer', 'UI Designer', 'Product Designer', 'Graphic Designer',
  'Marketing Manager', 'Digital Marketing Specialist', 'Content Manager', 'SEO Specialist',
  'Sales Manager', 'Account Manager', 'Business Developer', 'Sales Representative',
  'Finance Manager', 'Controller', 'Accountant', 'CFO',
  'HR Manager', 'Recruiter', 'People & Culture Manager',
  'Operations Manager', 'Supply Chain Manager', 'Logistics Coordinator',
  'Consultant', 'Management Consultant', 'IT Consultant',
  // Swedish
  'Mjukvaruutvecklare', 'Frontendutvecklare', 'Backendutvecklare', 'Systemutvecklare',
  'Projektledare', 'Produktchef', 'Verksamhetsutvecklare', 'Affärsutvecklare',
  'Marknadsförare', 'Ekonom', 'Redovisningsekonom', 'Personalchef', 'Rekryterare',
];

export interface SearchFilters {
  workType: 'any' | 'remote' | 'hybrid' | 'onsite';
  jobType: 'any' | 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'any' | 'junior' | 'mid' | 'senior' | 'lead';
}

import { MarketId, getMarket } from '@/lib/markets';

interface SearchHeaderProps {
  onSearch: (q: string, l: string, d: string, filters?: SearchFilters) => void;
  market?: MarketId;
}

interface SearchPreset {
  id: string;
  query: string;
  location: string;
  dateFilter: string;
  pinned: boolean;
  lastUsed: number;
}

const DATE_OPTIONS = [
  { value: 'any',  label: 'Any time' },
  { value: '1h',   label: '1h' },
  { value: '2h',   label: '2h' },
  { value: '4h',   label: '4h' },
  { value: '12h',  label: '12h' },
  { value: '24h',  label: '24h' },
  { value: '48h',  label: '48h' },
  { value: '72h',  label: '72h' },
  { value: '7d',   label: '7d' },
  { value: '14d',  label: '14d' },
  { value: '30d',  label: '30d' },
];

const QUICK_FILTERS = ['1h', '4h', '24h', '48h', '7d'];
const STORAGE_KEY = 'resvio_presets';
const MAX_RECENT = 8;

function loadPresets(): SearchPreset[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function savePresets(p: SearchPreset[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function presetLabel(p: SearchPreset) {
  return [p.query, p.location].filter(Boolean).join(' / ') || 'Search';
}

// External links are now per-market, resolved at render time

export default function SearchHeader({ onSearch, market = 'scandinavia' }: SearchHeaderProps) {
  const marketConfig = getMarket(market);
  const [query, setQuery]         = useState('');
  const [location, setLocation]   = useState('');
  const [dateFilter, setDate]     = useState('any');
  const [presets, setPresets]     = useState<SearchPreset[]>([]);
  const [focused, setFocused]     = useState<'q' | 'l' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]     = useState<SearchFilters>({ workType: 'any', jobType: 'any', experienceLevel: 'any' });
  const [qSuggestions, setQSuggestions] = useState<string[]>([]);
  const [lSuggestions, setLSuggestions] = useState<string[]>([]);
  const [activeSugIdx, setActiveSugIdx] = useState(-1);
  const qRef = useRef<HTMLInputElement>(null);
  const lRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPresets(loadPresets()); }, []);

  // Job title suggestions
  useEffect(() => {
    if (!query.trim() || focused !== 'q') { setQSuggestions([]); return; }
    const q = query.toLowerCase();
    const matches = JOB_TITLES.filter(t => t.toLowerCase().includes(q) && t.toLowerCase() !== q).slice(0, 6);
    setQSuggestions(matches);
    setActiveSugIdx(-1);
  }, [query, focused]);

  // Location suggestions — use market-specific locations
  const allLocations = [...new Set([...marketConfig.defaultLocations, ...LOCATIONS])];
  useEffect(() => {
    if (!location.trim() || focused !== 'l') { setLSuggestions([]); return; }
    const l = location.toLowerCase();
    const matches = allLocations.filter(c => c.toLowerCase().startsWith(l) && c.toLowerCase() !== l).slice(0, 5);
    setLSuggestions(matches);
    setActiveSugIdx(-1);
  }, [location, focused, market]);

  const persist = useCallback((updated: SearchPreset[]) => {
    setPresets(updated);
    savePresets(updated);
  }, []);

  const recordSearch = useCallback((q: string, l: string, d: string) => {
    const current = loadPresets();
    const key = `${q.toLowerCase().trim()}|${l.toLowerCase().trim()}`;
    const existing = current.find(p => `${p.query.toLowerCase().trim()}|${p.location.toLowerCase().trim()}` === key);
    if (existing) {
      persist(current.map(p => p.id === existing.id ? { ...p, lastUsed: Date.now(), dateFilter: d } : p));
      return;
    }
    const newPreset: SearchPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      query: q, location: l, dateFilter: d, pinned: false, lastUsed: Date.now(),
    };
    const pinned = current.filter(p => p.pinned);
    const recent = current.filter(p => !p.pinned);
    persist([...pinned, ...([newPreset, ...recent].slice(0, MAX_RECENT))]);
  }, [persist]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !location) return;
    setQSuggestions([]);
    setLSuggestions([]);
    const expandedQuery = addSynonyms(query);
    onSearch(expandedQuery, location, dateFilter, filters);
    recordSearch(query, location, dateFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent, suggestions: string[], setValue: (v: string) => void, closeSug: () => void) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSugIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSugIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeSugIdx >= 0) { e.preventDefault(); setValue(suggestions[activeSugIdx]); closeSug(); setActiveSugIdx(-1); }
    if (e.key === 'Escape') closeSug();
  };

  const activeFilterCount = [filters.workType, filters.jobType, filters.experienceLevel].filter(v => v !== 'any').length;

  const applyPreset = (p: SearchPreset) => {
    setQuery(p.query);
    setLocation(p.location);
    setDate(p.dateFilter);
    onSearch(p.query, p.location, p.dateFilter);
    persist(presets.map(pr => pr.id === p.id ? { ...pr, lastUsed: Date.now() } : pr));
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persist(presets.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  const removePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persist(presets.filter(p => p.id !== id));
  };

  const pinned = presets.filter(p => p.pinned).sort((a, b) => b.lastUsed - a.lastUsed);
  const recent = presets.filter(p => !p.pinned).sort((a, b) => b.lastUsed - a.lastUsed);

  const inputBase: React.CSSProperties = {
    flex: 1,
    padding: '0 16px',
    height: '48px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    outline: 'none',
    minWidth: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Main search bar ── */}
      <form onSubmit={handleSearch}>
        <div
          className="search-bar-wrap"
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: 'var(--bg-elevated)',
            border: `1px solid ${focused ? 'var(--border-accent)' : 'var(--border-default)'}`,
            borderRadius: 'var(--r-xl)',
            boxShadow: focused ? '0 0 0 3px var(--accent-dim)' : 'none',
            transition: 'border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
          }}
        >
          {/* Query field: icon + input grouped */}
          <div className="search-field-group" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0 0 18px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              ref={qRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused('q')}
              onBlur={() => setTimeout(() => setQSuggestions([]), 150)}
              onKeyDown={e => handleKeyDown(e, qSuggestions, setQuery, () => setQSuggestions([]))}
              placeholder="Job title, role, company…"
              style={inputBase}
              autoComplete="off"
            />
            {qSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)',
                overflow: 'hidden', marginTop: '4px',
              }}>
                {qSuggestions.map((s, i) => (
                  <div
                    key={s}
                    onMouseDown={() => { setQuery(s); setQSuggestions([]); }}
                    style={{
                      padding: '9px 16px', cursor: 'pointer', fontSize: 'var(--text-sm)',
                      color: i === activeSugIdx ? 'var(--accent-light)' : 'var(--text-primary)',
                      background: i === activeSugIdx ? 'var(--accent-dim)' : 'transparent',
                      transition: 'background var(--duration-fast) ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i === activeSugIdx ? 'var(--accent-dim)' : 'transparent')}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vertical divider (desktop) / Horizontal divider (mobile) */}
          <div className="search-divider-v" style={{ width: '1px', background: 'var(--border-dim)', margin: '10px 0', flexShrink: 0 }} />
          <div className="search-divider-h" style={{ display: 'none', height: '1px', background: 'var(--border-dim)', margin: '0 14px' }} />

          {/* Location field: icon + input grouped */}
          <div className="search-field-group search-location-group" style={{ display: 'flex', alignItems: 'center', flex: '0 0 200px', minWidth: 0, position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0 0 14px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
            <input
              ref={lRef}
              value={location}
              onChange={e => setLocation(e.target.value)}
              onFocus={() => setFocused('l')}
              onBlur={() => setTimeout(() => setLSuggestions([]), 150)}
              onKeyDown={e => handleKeyDown(e, lSuggestions, setLocation, () => setLSuggestions([]))}
              placeholder="Location…"
              style={{ ...inputBase }}
              autoComplete="off"
            />
            {lSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)',
                overflow: 'hidden', marginTop: '4px',
              }}>
                {lSuggestions.map((s, i) => (
                  <div
                    key={s}
                    onMouseDown={() => { setLocation(s); setLSuggestions([]); }}
                    style={{
                      padding: '9px 16px', cursor: 'pointer', fontSize: 'var(--text-sm)',
                      color: i === activeSugIdx ? 'var(--accent-light)' : 'var(--text-primary)',
                      background: i === activeSugIdx ? 'var(--accent-dim)' : 'transparent',
                      transition: 'background var(--duration-fast) ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i === activeSugIdx ? 'var(--accent-dim)' : 'transparent')}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="search-submit-btn"
            style={{
              margin: '5px',
              padding: '0 24px',
              background: 'var(--gradient-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'calc(var(--r-xl) - 5px)',
              fontWeight: '700',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'opacity var(--duration-fast) ease',
              letterSpacing: '0.01em',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* ── Remote quick-filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => {
            const newLoc = location.toLowerCase() === 'remote' ? '' : 'Remote';
            setLocation(newLoc);
            if (query) onSearch(addSynonyms(query), newLoc, dateFilter, filters);
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 14px', borderRadius: 'var(--r-full)',
            border: location.toLowerCase() === 'remote' ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
            background: location.toLowerCase() === 'remote' ? 'var(--accent-dim)' : 'transparent',
            color: location.toLowerCase() === 'remote' ? 'var(--accent-light)' : 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer',
            transition: 'all var(--duration-fast) ease',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Remote only
        </button>
      </div>

      {/* ── Filter row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: '600', flexShrink: 0 }}>Posted:</span>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setDate(opt.value);
                if (query || location) onSearch(query, location, opt.value);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--r-full)',
                border: dateFilter === opt.value ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
                background: dateFilter === opt.value ? 'var(--accent-dim)' : 'transparent',
                color: dateFilter === opt.value ? 'var(--accent-light)' : 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                fontWeight: dateFilter === opt.value ? '700' : '500',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setShowFilters(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--r-full)',
            border: (showFilters || activeFilterCount > 0) ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
            background: (showFilters || activeFilterCount > 0) ? 'var(--accent-dim)' : 'transparent',
            color: (showFilters || activeFilterCount > 0) ? 'var(--accent-light)' : 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)', fontWeight: '600', cursor: 'pointer',
            transition: 'all var(--duration-fast) ease',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.55rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setFilters({ workType: 'any', jobType: 'any', experienceLevel: 'any' }); }}
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          padding: '16px', background: 'var(--bg-surface)',
          borderRadius: 'var(--r-lg)', border: '1px solid var(--border-dim)',
          animation: 'fadeInUp 0.2s var(--ease-out)',
        }}>
          <FilterGroup
            label="Work type"
            options={[{ value: 'any', label: 'Any' }, { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' }]}
            value={filters.workType}
            onChange={v => setFilters(f => ({ ...f, workType: v as SearchFilters['workType'] }))}
          />
          <FilterGroup
            label="Job type"
            options={[{ value: 'any', label: 'Any' }, { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' }, { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' }]}
            value={filters.jobType}
            onChange={v => setFilters(f => ({ ...f, jobType: v as SearchFilters['jobType'] }))}
          />
          <FilterGroup
            label="Experience"
            options={[{ value: 'any', label: 'Any level' }, { value: 'junior', label: 'Junior' }, { value: 'mid', label: 'Mid-level' }, { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead / Manager' }]}
            value={filters.experienceLevel}
            onChange={v => setFilters(f => ({ ...f, experienceLevel: v as SearchFilters['experienceLevel'] }))}
          />
          <style>{`
            @media (max-width: 560px) {
              .filter-panel-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      )}

      {/* ── Saved presets ── */}
      {pinned.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--text-accent)', flexShrink: 0 }}>★ Saved</span>
          {pinned.map(p => (
            <PresetPill key={p.id} preset={p} onApply={() => applyPreset(p)} onPin={e => togglePin(p.id, e)} onRemove={e => removePreset(p.id, e)} accent />
          ))}
        </div>
      )}

      {/* ── Recent searches ── */}
      {recent.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>Recent:</span>
          {recent.slice(0, 5).map(p => (
            <PresetPill key={p.id} preset={p} onApply={() => applyPreset(p)} onPin={e => togglePin(p.id, e)} onRemove={e => removePreset(p.id, e)} accent={false} />
          ))}
        </div>
      )}

      {/* ── External links (market-specific) ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '2px' }}>
        {marketConfig.externalLinks.map(site => (
          <a
            key={site.name}
            href={site.url(query, location)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
              transition: 'color var(--duration-fast) ease',
            }}
          >
            <span style={{ borderBottom: '1px dashed var(--border-bright)' }}>{site.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ))}
      </div>

      <style>{`
        @media (max-width: 680px) {
          .search-bar-wrap {
            flex-direction: column !important;
            border-radius: var(--r-lg) !important;
            align-items: stretch !important;
          }
          .search-field-group {
            flex: unset !important;
            width: 100% !important;
          }
          .search-location-group {
            flex: unset !important;
          }
          .search-field-group span:first-child {
            padding: 0 0 0 14px !important;
          }
          .search-bar-wrap input {
            height: 48px !important;
          }
          .search-divider-v {
            display: none !important;
          }
          .search-divider-h {
            display: block !important;
          }
          .search-submit-btn {
            margin: 6px !important;
            padding: 13px 0 !important;
            width: calc(100% - 12px) !important;
            border-radius: var(--r-md) !important;
          }
        }
      `}</style>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', margin: 0 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--r-full)',
              border: value === opt.value ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
              background: value === opt.value ? 'var(--accent-dim)' : 'transparent',
              color: value === opt.value ? 'var(--accent-light)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)', fontWeight: value === opt.value ? '700' : '500',
              cursor: 'pointer', transition: 'all var(--duration-fast) ease',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PresetPill({ preset, onApply, onPin, onRemove, accent }: {
  preset: SearchPreset;
  onApply: () => void;
  onPin: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  accent: boolean;
}) {
  const dateLabel = preset.dateFilter && preset.dateFilter !== 'any'
    ? ` · ${preset.dateFilter}`
    : '';

  return (
    <div
      onClick={onApply}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 6px 3px 10px',
        borderRadius: 'var(--r-full)',
        cursor: 'pointer',
        background: accent ? 'var(--accent-dim)' : 'var(--bg-overlay)',
        border: accent ? '1px solid var(--border-accent)' : '1px solid var(--border-dim)',
        fontSize: 'var(--text-xs)',
        color: accent ? 'var(--accent-light)' : 'var(--text-secondary)',
        transition: 'all var(--duration-fast) ease',
        maxWidth: '200px',
        userSelect: 'none',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {presetLabel(preset)}{dateLabel}
      </span>
      <button
        onClick={onPin}
        title={preset.pinned ? 'Unpin' : 'Pin'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: preset.pinned ? 'var(--accent-light)' : 'var(--text-tertiary)',
          fontSize: '0.7rem', padding: '0 2px', lineHeight: 1,
          transition: 'color var(--duration-fast) ease',
        }}
      >
        {preset.pinned ? '★' : '☆'}
      </button>
      <button
        onClick={onRemove}
        title="Remove"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', fontSize: '0.65rem',
          padding: '0 2px', lineHeight: 1,
          transition: 'color var(--duration-fast) ease',
        }}
      >
        ✕
      </button>
    </div>
  );
}
