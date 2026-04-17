import { Job } from '../../types';

export class LinkedInScraper {
  static async scrape(query: string, location: string, pageNumber: number = 1, dateFilter: string = ''): Promise<Job[]> {
    if (process.env.VERCEL === '1') {
      console.warn("LinkedIn scraper disabled on Vercel. Playwright requires a local environment.");
      return [];
    }

    const limit = 25;
    const start = (pageNumber - 1) * limit;
    
    let url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${start}`;

    if (dateFilter && dateFilter !== 'any') {
      // f_TPR uses seconds: r{seconds}
      const tprMap: Record<string, string> = {
        '1h':  'r3600',
        '2h':  'r7200',
        '4h':  'r14400',
        '12h': 'r43200',
        '24h': 'r86400',
        '48h': 'r172800',
        '72h': 'r259200',
        '7d':  'r604800',
        '14d': 'r1209600',
        '30d': 'r2592000',
      };
      if (tprMap[dateFilter]) {
        url += `&f_TPR=${tprMap[dateFilter]}`;
      }
    }

    // @ts-ignore
    const reqInstance = typeof window === 'undefined' ? eval('require') : null;
    const playwright = reqInstance('playwright-extra');
    const stealthPlugin = reqInstance('puppeteer-extra-plugin-stealth');
    playwright.chromium.use(stealthPlugin());
    
    const browser = await playwright.chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();
      
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      
      // The public jobs page often loads results in an unordered list
      try {
        await page.waitForSelector('.base-search-card', { timeout: 5000 });
      } catch (e) {
        console.warn('LinkedIn Scraper: Could not find .base-search-card. Showing zero results or IP blocked.');
        return [];
      }

      const jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.base-search-card'));
        return cards.slice(0, 10).map(card => {
          const titleEl = card.querySelector('.base-search-card__title');
          const companyEl = card.querySelector('.base-search-card__subtitle');
          const locationEl = card.querySelector('.job-search-card__location');
          const urlEl = card.querySelector('a.base-card__full-link') as HTMLAnchorElement;
          
          return {
            id: `li-${Math.random().toString(36).substr(2, 9)}`,
            source: 'LinkedIn' as const,
            title: titleEl?.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown Company',
            location: locationEl?.textContent?.trim() || 'Unknown Location',
            description: 'Description available upon viewing the offer.',
            url: urlEl?.href?.split('?')[0] || '', // Clean URL
            postedAt: new Date().toISOString().split('T')[0],
            logo: '' // LinkedIn public logos are often lazy-loaded via complex data tags
          };
        });
      });

      return jobs;
    } catch (error) {
      console.error('LinkedIn Scraping error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}
