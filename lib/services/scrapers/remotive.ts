/**
 * Remotive.io Job Search API
 * Docs: https://remotive.com/api
 * No API key required — completely free, remote-jobs focused
 *
 * Great for: remote roles worldwide, software/design/marketing/finance
 */

import { Job } from '../../types';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  publication_date: string;
  description: string;
  salary?: string;
  tags?: string[];
}

export class RemotiveService {
  static async search(
    query: string,
    _location: string,
    _page: number = 1,
    _dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      const params = new URLSearchParams({ search: query, limit: '20' });
      const url = `https://remotive.com/api/remote-jobs?${params}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        console.warn(`[Remotive] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const jobs: RemotiveJob[] = data?.jobs ?? [];

      return jobs.map((j): Job => ({
        id: `remotive-${j.id}`,
        source: 'Remotive',
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Remote',
        description: j.description?.replace(/<[^>]+>/g, ' ').slice(0, 600) || '',
        url: j.url,
        postedAt: j.publication_date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        salary: j.salary || undefined,
        tags: j.tags?.slice(0, 5) ?? [j.category],
      }));
    } catch (err) {
      console.error('[Remotive] fetch error:', err);
      return [];
    }
  }
}
