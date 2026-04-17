/**
 * Adzuna Job Search API
 * Docs: https://developer.adzuna.com/
 * Requires: ADZUNA_APP_ID and ADZUNA_APP_KEY env vars (free at developer.adzuna.com)
 *
 * Supported country codes:
 *   Scandinavia: se (Sweden), no (Norway), dk (Denmark)
 *   Western EU:  gb (UK), de (Germany), nl (Netherlands), fr (France),
 *                at (Austria), be (Belgium), ch (Switzerland)
 *   Eastern EU:  pl (Poland)
 *   Southern EU: es (Spain), it (Italy)
 */

import { Job } from '../../types';

const APP_ID  = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

/** Map market/location to Adzuna country code */
function countryCode(location: string): string {
  const l = location.toLowerCase();
  if (l.includes('stockholm') || l.includes('göteborg') || l.includes('gothenburg') ||
      l.includes('malmö') || l.includes('sweden') || l.includes('sverige')) return 'se';
  if (l.includes('oslo') || l.includes('bergen') || l.includes('norway') || l.includes('norge')) return 'no';
  if (l.includes('copenhagen') || l.includes('aarhus') || l.includes('denmark') || l.includes('danish')) return 'dk';
  if (l.includes('london') || l.includes('manchester') || l.includes('uk') || l.includes('england')) return 'gb';
  if (l.includes('berlin') || l.includes('munich') || l.includes('hamburg') || l.includes('germany') || l.includes('deutschland')) return 'de';
  if (l.includes('amsterdam') || l.includes('rotterdam') || l.includes('netherlands')) return 'nl';
  if (l.includes('paris') || l.includes('lyon') || l.includes('france')) return 'fr';
  if (l.includes('warsaw') || l.includes('krakow') || l.includes('kraków') || l.includes('wrocław') || l.includes('poland')) return 'pl';
  if (l.includes('madrid') || l.includes('barcelona') || l.includes('spain')) return 'es';
  if (l.includes('milan') || l.includes('rome') || l.includes('italy')) return 'it';
  if (l.includes('vienna') || l.includes('austria')) return 'at';
  if (l.includes('zurich') || l.includes('switzerland')) return 'ch';
  // Default: pick closest by continent — Sweden (most used market)
  return 'se';
}

interface AdzunaResult {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  category?: { label: string };
}

export class AdzunaService {
  static async search(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    if (!APP_ID || !APP_KEY) return [];

    try {
      const country = countryCode(location);
      const params = new URLSearchParams({
        app_id: APP_ID,
        app_key: APP_KEY,
        results_per_page: '20',
        what: query,
        where: location,
        'content-type': 'application/json',
      });

      // Date filter → max_days_old
      if (dateFilter && dateFilter !== 'any') {
        const daysMap: Record<string, number> = {
          '1h': 1, '2h': 1, '4h': 1, '12h': 1,
          '24h': 1, '48h': 2, '72h': 3, '7d': 7, '14d': 14, '30d': 30,
        };
        const days = daysMap[dateFilter];
        if (days) params.set('max_days_old', String(days));
      }

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (!res.ok) {
        console.warn(`[Adzuna] ${country} → HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const results: AdzunaResult[] = data?.results ?? [];

      return results.map((r): Job => {
        const salary =
          r.salary_min && r.salary_max
            ? `${Math.round(r.salary_min / 1000)}k – ${Math.round(r.salary_max / 1000)}k`
            : undefined;

        return {
          id: `adzuna-${r.id}`,
          source: 'Adzuna',
          title: r.title,
          company: r.company?.display_name ?? 'Unknown',
          location: r.location?.display_name ?? location,
          description: r.description,
          url: r.redirect_url,
          postedAt: r.created?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          salary,
          tags: r.category?.label ? [r.category.label] : [],
        };
      });
    } catch (err) {
      console.error('[Adzuna] fetch error:', err);
      return [];
    }
  }
}
