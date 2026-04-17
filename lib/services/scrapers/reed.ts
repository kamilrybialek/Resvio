/**
 * Reed.co.uk Job Search API
 * Docs: https://www.reed.co.uk/developers/jobseeker
 * Register free at: https://www.reed.co.uk/developers
 * Requires: REED_API_KEY env var
 *
 * Coverage: United Kingdom only.
 * Auth: Basic Auth with API key as username, empty password.
 */

import { Job } from '../../types';

const API_KEY = process.env.REED_API_KEY;

interface ReedJob {
  jobId: number;
  employerId: number;
  employerName: string;
  employerProfileId?: number;
  employerProfileName?: string;
  jobTitle: string;
  locationName: string;
  minimumSalary?: number;
  maximumSalary?: number;
  currency?: string;
  expirationDate: string;
  date: string;
  jobDescription: string;
  applications: number;
  jobUrl: string;
}

export class ReedService {
  static async search(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    if (!API_KEY) return [];

    try {
      const resultsToSkip = (page - 1) * 20;
      const params = new URLSearchParams({
        keywords: query,
        locationName: location,
        resultsToTake: '20',
        resultsToSkip: String(resultsToSkip),
      });

      // Date filter → postedByRecruitmentAgency not available; use minimumDate
      if (dateFilter && dateFilter !== 'any') {
        const daysMap: Record<string, number> = {
          '1h': 1, '2h': 1, '4h': 1, '12h': 1,
          '24h': 1, '48h': 2, '72h': 3, '7d': 7, '14d': 14, '30d': 30,
        };
        const days = daysMap[dateFilter];
        if (days) {
          const since = new Date();
          since.setDate(since.getDate() - days);
          params.set('minimumDate', since.toISOString().split('T')[0]);
        }
      }

      const auth = Buffer.from(`${API_KEY}:`).toString('base64');
      const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(`[Reed] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const results: ReedJob[] = data?.results ?? [];

      return results.map((r): Job => {
        const salary =
          r.minimumSalary && r.maximumSalary
            ? `£${Math.round(r.minimumSalary / 1000)}k – £${Math.round(r.maximumSalary / 1000)}k`
            : undefined;

        return {
          id: `reed-${r.jobId}`,
          source: 'Reed',
          title: r.jobTitle,
          company: r.employerName,
          location: r.locationName,
          description: r.jobDescription?.replace(/<[^>]+>/g, '')?.trim() ?? '',
          url: r.jobUrl,
          postedAt: r.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          salary,
          tags: [],
        };
      });
    } catch (err) {
      console.error('[Reed] fetch error:', err);
      return [];
    }
  }
}
