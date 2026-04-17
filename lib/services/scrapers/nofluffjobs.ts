/**
 * No Fluff Jobs — Poland tech job board
 * Uses their public JSON feed (no API key required).
 * Endpoint: https://nofluffjobs.com/api/postings
 */

import { Job } from '../../types';

interface NFJPosting {
  id: string;
  name: string;
  title?: string;
  location?: {
    places?: Array<{ city?: string; country?: { name?: string } }>;
    fullyRemote?: boolean;
  };
  seniority?: string[];
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    type?: string;
  };
  technology?: string;
  category?: string;
  tags?: string[];
  posted?: string;
  renewed?: string;
  url?: string;
  logo?: string;
  company?: {
    name?: string;
    logoUrl?: string;
  };
}

function dateFilterMs(dateFilter: string): number {
  const now = Date.now();
  const map: Record<string, number> = {
    '1h': 3_600_000, '2h': 7_200_000, '4h': 14_400_000,
    '12h': 43_200_000, '24h': 86_400_000, '48h': 172_800_000,
    '72h': 259_200_000, '7d': 604_800_000, '14d': 1_209_600_000,
    '30d': 2_592_000_000,
  };
  return map[dateFilter] ? now - map[dateFilter] : 0;
}

export class NoFluffJobsScraper {
  static async scrape(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      const isRemote = location.toLowerCase().includes('remote') || location.toLowerCase() === 'zdalne';

      // Try their search endpoint first
      const searchUrl = `https://nofluffjobs.com/api/postings?` + new URLSearchParams({
        ...(query ? { q: query } : {}),
        ...(isRemote ? { remote: 'true' } : { location }),
      });

      const res = await fetch(searchUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const postings: NFJPosting[] = Array.isArray(data)
        ? data
        : (data?.postings ?? data?.items ?? data?.data ?? []);

      if (!postings.length) return [];

      const sinceMs = dateFilterMs(dateFilter);
      const q = query.toLowerCase();

      const filtered = postings.filter(p => {
        if (sinceMs) {
          const postedAt = new Date(p.posted ?? p.renewed ?? '').getTime();
          if (!isNaN(postedAt) && postedAt < sinceMs) return false;
        }
        if (q) {
          const name = (p.name ?? p.title ?? '').toLowerCase();
          const tech = (p.technology ?? '').toLowerCase();
          const cat  = (p.category ?? '').toLowerCase();
          const tags = (p.tags ?? []).join(' ').toLowerCase();
          if (!name.includes(q) && !tech.includes(q) && !cat.includes(q) && !tags.includes(q)) return false;
        }
        if (!isRemote && location) {
          const loc = location.toLowerCase();
          const cities = (p.location?.places ?? []).map(pl => (pl.city ?? '').toLowerCase());
          if (p.location?.fullyRemote) return true;
          if (!cities.some(c => c.includes(loc))) return false;
        }
        return true;
      });

      // Sort newest first
      filtered.sort((a, b) =>
        new Date(b.posted ?? b.renewed ?? '').getTime() -
        new Date(a.posted ?? a.renewed ?? '').getTime(),
      );

      const perPage = 20;
      const slice = filtered.slice((page - 1) * perPage, page * perPage);

      return slice.map((p): Job => {
        const places = p.location?.places ?? [];
        const city = places[0]?.city ?? '';
        const locationStr = p.location?.fullyRemote ? 'Remote' : city;

        const sal = p.salary;
        const salary = sal?.from && sal?.to
          ? `${sal.from.toLocaleString('pl-PL')} – ${sal.to.toLocaleString('pl-PL')} ${sal.currency ?? 'PLN'}`
          : undefined;

        const tags = [
          ...(p.tags ?? []),
          ...(p.technology ? [p.technology] : []),
        ].slice(0, 6);

        return {
          id: `nfj-${p.id}`,
          source: 'NoFluffJobs',
          title: p.name ?? p.title ?? '',
          company: p.company?.name ?? 'Unknown',
          location: locationStr,
          description: `${p.seniority?.join(', ') ?? ''} ${p.category ?? ''} role${tags.length ? ` — ${tags.join(', ')}` : ''}`.trim(),
          url: p.url ?? `https://nofluffjobs.com/job/${p.id}`,
          postedAt: (p.posted ?? p.renewed ?? new Date().toISOString()).split('T')[0],
          salary,
          tags,
          logo: p.company?.logoUrl ?? p.logo,
        };
      });
    } catch (err) {
      console.error('[NoFluffJobs] fetch error:', err);
      return [];
    }
  }
}
