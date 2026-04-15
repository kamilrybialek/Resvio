import { Job } from '../../types';

interface JJITOffer {
  id: string;
  title: string;
  company_name: string;
  city: string;
  country_code: string;
  workplace_type: 'remote' | 'hybrid' | 'partly_remote' | 'office';
  remote: boolean;
  experience_level: string;
  published_at: string;
  body?: string;
  description?: string;
  required_skills: Array<{ name: string; level: number }>;
  nice_to_have_skills: Array<{ name: string; level: number }>;
  employment_types: Array<{
    type: string;
    salary?: { from: number; to: number; currency: string };
  }>;
  multilocation?: Array<{ city: string; slug: string }>;
  logo?: string;
}

function isRemoteSearch(location: string): boolean {
  const l = location.toLowerCase();
  return l === 'remote' || l === 'zdalne' || l === 'remote (europe)' || l === 'remote (poland)';
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

export class JustJoinITScraper {
  static async scrape(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      const remote = isRemoteSearch(location);

      // JustJoinIT public JSON API — returns full offer list
      const url = remote
        ? 'https://justjoin.it/api/offers/search?remote=true'
        : `https://justjoin.it/api/offers/search`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        // Fallback to base endpoint
        return await JustJoinITScraper.scrapeBase(query, location, page, dateFilter);
      }

      const raw = await res.json();
      const data: JJITOffer[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.offers ?? []);
      if (!data.length) return await JustJoinITScraper.scrapeBase(query, location, page, dateFilter);

      return JustJoinITScraper.processOffers(data, query, location, page, dateFilter, remote);
    } catch {
      return JustJoinITScraper.scrapeBase(query, location, page, dateFilter).catch(() => []);
    }
  }

  private static async scrapeBase(
    query: string,
    location: string,
    page: number,
    dateFilter: string,
  ): Promise<Job[]> {
    const remote = isRemoteSearch(location);
    const res = await fetch('https://justjoin.it/api/offers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const data: JJITOffer[] = await res.json();
    return JustJoinITScraper.processOffers(data, query, location, page, dateFilter, remote);
  }

  private static processOffers(
    data: JJITOffer[],
    query: string,
    location: string,
    page: number,
    dateFilter: string,
    remote: boolean,
  ): Job[] {
    const q = query.toLowerCase().trim();
    const loc = location.toLowerCase().trim();
    const sinceMs = dateFilterMs(dateFilter);

    const filtered = data.filter(offer => {
      // Date filter
      if (sinceMs) {
        const posted = new Date(offer.published_at).getTime();
        if (isNaN(posted) || posted < sinceMs) return false;
      }

      // Remote filter
      if (remote) {
        return offer.workplace_type === 'remote' || offer.remote === true;
      }

      // Location filter
      if (loc && loc !== 'remote') {
        const city = (offer.city || '').toLowerCase();
        const multiloc = (offer.multilocation || []).some(m =>
          m.city?.toLowerCase().includes(loc),
        );
        if (!city.includes(loc) && !multiloc) return false;
      }

      // Query filter
      if (q) {
        const skills = (offer.required_skills || []).map(s => s.name.toLowerCase());
        const titleMatch = offer.title?.toLowerCase().includes(q);
        const skillMatch = skills.some(s => s.includes(q));
        const companyMatch = offer.company_name?.toLowerCase().includes(q);
        if (!titleMatch && !skillMatch && !companyMatch) return false;
      }

      return true;
    });

    // Sort newest first
    filtered.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

    const perPage = 20;
    const slice = filtered.slice((page - 1) * perPage, page * perPage);

    return slice.map(offer => {
      const salaryEntry = offer.employment_types?.[0]?.salary;
      const salary = salaryEntry
        ? `${salaryEntry.from?.toLocaleString('pl-PL')} – ${salaryEntry.to?.toLocaleString('pl-PL')} ${salaryEntry.currency || 'PLN'}`
        : undefined;

      const skills = [
        ...(offer.required_skills || []),
        ...(offer.nice_to_have_skills || []),
      ]
        .map(s => s.name)
        .slice(0, 8);

      const wt = offer.workplace_type;
      const locationStr =
        wt === 'remote'
          ? 'Remote'
          : wt === 'hybrid'
          ? `${offer.city} (Hybrid)`
          : wt === 'partly_remote'
          ? `${offer.city} (Part-remote)`
          : offer.city || '';

      return {
        id: `jjit-${offer.id}`,
        source: 'JustJoinIT' as const,
        title: offer.title || '',
        company: offer.company_name || '',
        location: locationStr,
        description: offer.body || offer.description || `Skills: ${skills.join(', ')}`,
        url: `https://justjoin.it/offers/${offer.id}`,
        postedAt: offer.published_at || new Date().toISOString(),
        salary,
        tags: skills.slice(0, 5),
        logo: offer.logo,
      } as Job;
    });
  }
}
