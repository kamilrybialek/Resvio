/**
 * Jooble Job Search API
 * Docs: https://jooble.org/api/about
 * Register free at: https://jooble.org/api/about (email them for key)
 * Requires: JOOBLE_API_KEY env var
 *
 * Coverage: 69 countries including Sweden, Norway, Denmark, Poland,
 *           Germany, Netherlands, France, UK, Czech Republic, etc.
 */

import { Job } from '../../types';

const API_KEY = process.env.JOOBLE_API_KEY;

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

export class JoobleService {
  static async search(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    if (!API_KEY) return [];

    try {
      const body: Record<string, string | number> = {
        keywords: query,
        location,
        page,
        ResultOnPage: 20,
      };

      // Jooble supports date_posted: '1' (today), '3' (3 days), '7' (week), '30' (month)
      if (dateFilter && dateFilter !== 'any') {
        const daysMap: Record<string, string> = {
          '1h': '1', '2h': '1', '4h': '1', '12h': '1',
          '24h': '1', '48h': '3', '72h': '3', '7d': '7', '14d': '7', '30d': '30',
        };
        const days = daysMap[dateFilter];
        if (days) body.date_posted = days;
      }

      const res = await fetch(`https://jooble.org/api/${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(`[Jooble] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const jobs: JoobleJob[] = data?.jobs ?? [];

      return jobs.map((j): Job => ({
        id: `jooble-${j.id || Buffer.from(j.link).toString('base64').slice(0, 12)}`,
        source: 'Jooble',
        title: j.title?.trim() ?? '',
        company: j.company?.trim() ?? 'Unknown',
        location: j.location?.trim() ?? location,
        description: j.snippet?.replace(/<[^>]+>/g, '')?.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")?.trim() ?? '',
        url: j.link,
        postedAt: j.updated?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        salary: j.salary || undefined,
        tags: [],
      }));
    } catch (err) {
      console.error('[Jooble] fetch error:', err);
      return [];
    }
  }
}
