import axios from 'axios';
import { Job } from '../../types';

/**
 * TheHub.io scraper using their public REST API.
 * Docs: https://thehub.io/api  (unofficial, reverse-engineered from their web app)
 * Endpoint: GET https://thehub.io/api/jobs
 */
export class TheHubScraper {
  private static API_BASE = 'https://thehub.io/api/jobs';

  static async scrape(
    query: string = '',
    location: string = 'Sweden',
    pageNumber: number = 1,
    dateFilter: string = ''
  ): Promise<Job[]> {
    try {
      const countryCode = location.toLowerCase().includes('denmark') ||
        location.toLowerCase().includes('dk') ? 'DK' :
        location.toLowerCase().includes('norway') ||
        location.toLowerCase().includes('no') ? 'NO' : 'SE';

      const params: Record<string, string | number> = {
        countryCode,
        page: pageNumber,
      };

      if (query) params.search = query;

      // Date filtering: calculate publishedAfter timestamp
      if (dateFilter && dateFilter !== 'any') {
        const now = new Date();
        const hours = parseHoursFilter(dateFilter);
        if (hours) {
          now.setHours(now.getHours() - hours);
          params.publishedAfter = now.toISOString();
        }
      }

      const response = await axios.get(TheHubScraper.API_BASE, {
        params,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const jobs: any[] = response.data?.jobs ?? response.data?.data ?? response.data ?? [];

      if (!Array.isArray(jobs)) return [];

      return jobs.map((job: any): Job => ({
        id: `th-${job.id || job._id || Math.random().toString(36).slice(2, 9)}`,
        source: 'The Hub',
        title: job.title || job.position || 'Unknown Title',
        company: job.company?.name || job.companyName || 'Unknown Company',
        location: job.locations?.[0]?.city || job.location || location,
        description: job.description || job.body || '',
        url: job.url || `https://thehub.io/jobs/${job.id || job._id}`,
        postedAt: job.publishedAt
          ? new Date(job.publishedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        logo: job.company?.logoUrl || job.logo || '',
        tags: job.skills?.map((s: any) => (typeof s === 'string' ? s : s.name)) || [],
      }));
    } catch (error: any) {
      // Fallback: try the scraper approach if the API fails
      console.warn('TheHub API request failed, trying scraper fallback:', error?.message);
      return TheHubScraper.scrapeFallback(query, location, pageNumber, dateFilter);
    }
  }

  /** Playwright-based fallback for when the API is unavailable. */
  private static async scrapeFallback(
    query: string,
    location: string,
    pageNumber: number,
    dateFilter: string
  ): Promise<Job[]> {
    if (process.env.VERCEL === '1') return [];

    try {
      // @ts-ignore
      const reqInstance = typeof window === 'undefined' ? eval('require') : null;
      if (!reqInstance) return [];

      const playwright = reqInstance('playwright');
      const countryCode = location.toLowerCase().includes('denmark') ? 'DK' :
        location.toLowerCase().includes('norway') ? 'NO' : 'SE';

      let url = `https://thehub.io/jobs?countryCode=${countryCode}`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (pageNumber > 1) url += `&page=${pageNumber}`;

      const browser = await playwright.chromium.launch({ headless: true });
      const page = await browser.newPage();

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForSelector('[data-test="job-card"], .job-card, [class*="JobCard"]', { timeout: 5000 }).catch(() => {});

        const jobs = await page.evaluate(() => {
          const selectors = ['[data-test="job-card"]', '.job-card', '[class*="JobCard"]'];
          let cards: Element[] = [];
          for (const sel of selectors) {
            cards = Array.from(document.querySelectorAll(sel));
            if (cards.length > 0) break;
          }

          return cards.map((card: Element) => {
            const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="Title"]');
            const companyEl = card.querySelector('[class*="company"], [class*="Company"]');
            const locationEl = card.querySelector('[class*="location"], [class*="Location"]');
            const linkEl = card.querySelector('a') as HTMLAnchorElement | null;
            const logoEl = card.querySelector('img') as HTMLImageElement | null;

            return {
              title: titleEl?.textContent?.trim() || '',
              company: companyEl?.textContent?.trim() || '',
              location: locationEl?.textContent?.trim() || '',
              url: linkEl?.href || '',
              logo: logoEl?.src || '',
            };
          }).filter((j: any) => j.title);
        });

        return jobs.map((j: any, idx: number): Job => ({
          id: `th-fb-${Date.now()}-${idx}`,
          source: 'The Hub',
          title: j.title,
          company: j.company || 'Unknown Company',
          location: j.location || location,
          description: '',
          url: j.url || 'https://thehub.io/jobs',
          postedAt: new Date().toISOString().split('T')[0],
          logo: j.logo || '',
        }));
      } finally {
        await browser.close();
      }
    } catch (err) {
      console.error('TheHub scraper fallback failed:', err);
      return [];
    }
  }
}

/** Convert dateFilter string to hours number. Returns null if filter is 'any'. */
function parseHoursFilter(filter: string): number | null {
  const map: Record<string, number> = {
    '1h': 1, '2h': 2, '4h': 4, '12h': 12,
    '24h': 24, '48h': 48, '72h': 72,
    '7d': 168, '14d': 336, '30d': 720,
  };
  return map[filter] ?? null;
}
