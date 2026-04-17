/**
 * Bundesagentur für Arbeit (German Federal Employment Agency)
 * Public API — no key required
 * Docs: https://jobsuche.api.bund.dev/
 *
 * Best for: German-speaking markets (DE, AT, CH)
 */

import { Job } from '../../types';

interface ArbeitsagenturJob {
  refnr: string;
  titel: string;
  beruf: string;
  arbeitgeber: string;
  arbeitsort?: {
    ort?: string;
    region?: string;
    land?: string;
    plz?: string;
  };
  eintrittsdatum?: string;
  aktuelleVeroeffentlichungsdatum?: string;
  externeUrl?: string;
  hashId?: string;
}

export class ArbeitsagenturService {
  static async search(
    query: string,
    location: string,
    page: number = 1,
    _dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      const params = new URLSearchParams({
        was: query,
        wo: location,
        page: String(page),
        size: '20',
      });

      const res = await fetch(
        `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`,
        {
          headers: {
            'X-API-Key': 'jobboerse-jobsuche',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (!res.ok) {
        console.warn(`[Arbeitsagentur] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const stellenangebote: ArbeitsagenturJob[] = data?.stellenangebote ?? [];

      return stellenangebote.map((j): Job => {
        const city = j.arbeitsort?.ort || j.arbeitsort?.region || location;
        const country = j.arbeitsort?.land || 'Deutschland';
        const jobUrl = j.externeUrl
          || `https://www.arbeitsagentur.de/jobsuche/jobdetail/${j.hashId || j.refnr}`;

        return {
          id: `ba-${j.refnr}`,
          source: 'Arbeitsagentur',
          title: j.titel || j.beruf || 'Unknown',
          company: j.arbeitgeber || 'Unknown',
          location: `${city}, ${country}`,
          description: j.beruf || j.titel || '',
          url: jobUrl,
          postedAt: j.aktuelleVeroeffentlichungsdatum?.split('T')[0]
            ?? new Date().toISOString().split('T')[0],
          tags: ['Germany'],
        };
      });
    } catch (err) {
      console.error('[Arbeitsagentur] fetch error:', err);
      return [];
    }
  }
}
