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
      
      // Try multiple selector patterns — LinkedIn changes its HTML periodically
      const cardSelector = await Promise.race([
        page.waitForSelector('.base-search-card',      { timeout: 4000 }).then(() => '.base-search-card'),
        page.waitForSelector('.job-search-card',       { timeout: 4000 }).then(() => '.job-search-card'),
        page.waitForSelector('[data-entity-urn]',      { timeout: 4000 }).then(() => '[data-entity-urn]'),
        page.waitForSelector('li.jobs-search-results__list-item', { timeout: 4000 }).then(() => 'li.jobs-search-results__list-item'),
      ]).catch(() => null);

      if (!cardSelector) {
        console.warn('LinkedIn Scraper: No job cards found — possible IP block or layout change.');
        return [];
      }

      const jobs = await page.evaluate((selector: string) => {
        const cards = Array.from(document.querySelectorAll(selector));
        return cards.slice(0, 10).map(card => {
          // Title: try multiple selectors
          const titleEl = card.querySelector('.base-search-card__title')
            || card.querySelector('h3.job-search-card__title')
            || card.querySelector('[class*="title"]')
            || card.querySelector('h3, h4');

          // Company: try multiple
          const companyEl = card.querySelector('.base-search-card__subtitle')
            || card.querySelector('h4.base-search-card__subtitle')
            || card.querySelector('[class*="company"]')
            || card.querySelector('h4, h5');

          // Location
          const locationEl = card.querySelector('.job-search-card__location')
            || card.querySelector('[class*="location"]')
            || card.querySelector('span[class*="location"]');

          // URL
          const urlEl = (card.querySelector('a.base-card__full-link')
            || card.querySelector('a[href*="/jobs/view/"]')
            || card.querySelector('a[href*="linkedin.com/jobs"]')
            || card.querySelector('a')) as HTMLAnchorElement | null;

          return {
            id: `li-${Math.random().toString(36).substr(2, 9)}`,
            source: 'LinkedIn' as const,
            title: titleEl?.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown Company',
            location: locationEl?.textContent?.trim() || 'Unknown Location',
            description: 'Description available upon viewing the offer.',
            url: urlEl?.href?.split('?')[0] || '',
            postedAt: new Date().toISOString().split('T')[0],
            logo: '',
          };
        }).filter(j => j.title !== 'Unknown' && j.url);
      }, cardSelector);

      return jobs;
    } catch (error) {
      console.error('LinkedIn Scraping error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}
