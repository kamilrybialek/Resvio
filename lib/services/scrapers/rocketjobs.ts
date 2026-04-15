/**
 * RocketJobs scraper — rocketjobs.pl
 * Uses Playwright on NAS/local; disabled on Vercel.
 */

import { Job } from '../../types';

function isRemoteSearch(location: string): boolean {
  const l = location.toLowerCase();
  return l === 'remote' || l === 'zdalne' || l === 'remote (europe)' || l === 'remote (poland)';
}

export class RocketJobsScraper {
  static async scrape(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    if (process.env.VERCEL === '1') return [];

    try {
      // First, try the JSON API endpoint (Next.js internals)
      const apiResult = await RocketJobsScraper.tryApi(query, location, page);
      if (apiResult.length > 0) return apiResult;

      // Fall back to Playwright
      return await RocketJobsScraper.scrapeWithPlaywright(query, location, page);
    } catch (err) {
      console.error('RocketJobs scraper error:', err);
      return [];
    }
  }

  private static async tryApi(query: string, location: string, page: number): Promise<Job[]> {
    const remote = isRemoteSearch(location);
    const params = new URLSearchParams({
      'search[keywords]': query,
      'search[city]': remote ? '' : location,
      'search[remote]': remote ? '1' : '0',
      page: String(page),
    });

    const endpoints = [
      `https://rocketjobs.pl/api/offers?${params}`,
      `https://rocketjobs.pl/job-offers.json?${params}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) continue;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) continue;
        const json = await res.json();
        const offers = Array.isArray(json) ? json : (json?.offers ?? json?.data ?? []);
        if (offers.length > 0) return RocketJobsScraper.mapApiOffers(offers);
      } catch {
        /* try next */
      }
    }
    return [];
  }

  private static mapApiOffers(offers: any[]): Job[] {
    return offers.slice(0, 20).map(o => {
      const salary = o.salary_from && o.salary_to
        ? `${o.salary_from?.toLocaleString('pl-PL')} – ${o.salary_to?.toLocaleString('pl-PL')} ${o.salary_currency || 'PLN'}`
        : undefined;
      return {
        id: `rocket-${o.id || o.slug}`,
        source: 'RocketJobs' as const,
        title: o.title || o.position || '',
        company: o.company?.name || o.company_name || '',
        location: o.remote ? 'Remote' : (o.city || o.location || ''),
        description: o.description || o.requirements || '',
        url: o.url || `https://rocketjobs.pl/job-offers/${o.slug || o.id}`,
        postedAt: o.published_at || o.created_at || new Date().toISOString(),
        salary,
        tags: (o.technologies || o.skills || []).slice(0, 5).map((t: any) =>
          typeof t === 'string' ? t : t.name,
        ),
      } as Job;
    });
  }

  private static async scrapeWithPlaywright(
    query: string,
    location: string,
    page: number,
  ): Promise<Job[]> {
    const { chromium } = await import('playwright');
    const remote = isRemoteSearch(location);

    const searchUrl = remote
      ? `https://rocketjobs.pl/job-offers?search[keywords]=${encodeURIComponent(query)}&search[remote]=1`
      : `https://rocketjobs.pl/job-offers?search[keywords]=${encodeURIComponent(query)}&search[city]=${encodeURIComponent(location)}`;

    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const ctx = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      });
      const pg = await ctx.newPage();
      await pg.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await pg.waitForTimeout(2500);

      const jobs: Job[] = await pg.evaluate((src) => {
        const cards = Array.from(
          document.querySelectorAll(
            '[data-test="job-offer-item"], .offer-card, article[class*="offer"], div[class*="JobOffer"]',
          ),
        );
        return cards.slice(0, 20).map((card, i) => {
          const title = (
            card.querySelector('h2, h3, [class*="title"], [class*="position"]') as HTMLElement
          )?.innerText?.trim() || '';
          const company = (
            card.querySelector('[class*="company"], [class*="employer"]') as HTMLElement
          )?.innerText?.trim() || '';
          const loc = (
            card.querySelector('[class*="location"], [class*="city"]') as HTMLElement
          )?.innerText?.trim() || '';
          const salary = (
            card.querySelector('[class*="salary"], [class*="wage"]') as HTMLElement
          )?.innerText?.trim() || undefined;
          const link = (card.querySelector('a[href*="/job-offers/"]') as HTMLAnchorElement)?.href || '';
          const tags = Array.from(
            card.querySelectorAll('[class*="tech"], [class*="skill"], [class*="tag"]'),
          )
            .map(t => (t as HTMLElement).innerText?.trim())
            .filter(Boolean)
            .slice(0, 5);
          return {
            id: `rocket-pw-${i}-${Date.now()}`,
            source: src,
            title,
            company,
            location: loc || (link.includes('remote') ? 'Remote' : ''),
            description: '',
            url: link || 'https://rocketjobs.pl',
            postedAt: new Date().toISOString(),
            salary,
            tags,
          };
        });
      }, 'RocketJobs' as const);

      return jobs.filter(j => j.title);
    } finally {
      await browser.close();
    }
  }
}
