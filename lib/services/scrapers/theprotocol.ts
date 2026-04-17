/**
 * TheProtocol.it (formerly Pracuj.pl tech jobs)
 * Public API — no key required
 * Focus: Polish tech market (IT, Software, Engineering)
 *
 * Endpoint: https://theprotocol.it/api/offers
 */

import { Job } from '../../types';

interface TheProtocolOffer {
  id: string;
  title: string;
  company?: { name: string };
  city?: string;
  workLocation?: string;
  technologies?: string[];
  publishedAt?: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  offerUrl?: string;
  slug?: string;
}

export class TheProtocolService {
  static async search(
    query: string,
    _location: string,
    page: number = 1,
    _dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      const params = new URLSearchParams({
        title: query,
        page: String(page),
        limit: '20',
      });

      const res = await fetch(
        `https://theprotocol.it/api/offers?${params}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (!res.ok) {
        console.warn(`[TheProtocol] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const offers: TheProtocolOffer[] = data?.offers ?? data?.data ?? [];

      return offers.map((j): Job => {
        const salaryStr = j.salaryFrom && j.salaryTo
          ? `${Math.round(j.salaryFrom / 1000)}k–${Math.round(j.salaryTo / 1000)}k ${j.salaryCurrency || 'PLN'}`
          : undefined;

        const jobUrl = j.offerUrl
          || (j.slug ? `https://theprotocol.it/oferta-pracy/${j.slug}` : '');

        return {
          id: `tp-${j.id}`,
          source: 'TheProtocol',
          title: j.title || 'Unknown',
          company: j.company?.name || 'Unknown',
          location: j.city || j.workLocation || 'Poland',
          description: j.technologies?.join(', ') || '',
          url: jobUrl,
          postedAt: j.publishedAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          salary: salaryStr,
          tags: j.technologies?.slice(0, 5) ?? [],
        };
      });
    } catch (err) {
      console.error('[TheProtocol] fetch error:', err);
      return [];
    }
  }
}
