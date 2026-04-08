import { Job } from '../../types';

export class IndeedScraper {
  static async scrape(query: string, location: string, pageNumber: number = 1, dateFilter: string = ''): Promise<Job[]> {
    if (process.env.VERCEL === '1') {
      console.warn("Indeed scraper disabled on Vercel.");
      return [];
    }

    const limit = 10;
    const start = (pageNumber - 1) * limit;
    
    // Normalize location for TLD selection
    const normalizedLoc = location.toLowerCase();
    const isDenmark = normalizedLoc.includes('denmark') || normalizedLoc.includes('copenhagen') || normalizedLoc === 'dk';
    const isNorway = normalizedLoc.includes('norway') || normalizedLoc.includes('oslo') || normalizedLoc === 'no';
    const tld = isDenmark ? 'dk' : isNorway ? 'no' : 'se'; // default to Sweden

    let url = `https://${tld}.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
    
    if (dateFilter && dateFilter !== 'any') {
      const fromageMap: Record<string, string> = {
        '24h': '1',
        '7d': '7',
        '30d': '30'
      };
      if (fromageMap[dateFilter]) {
        url += `&fromage=${fromageMap[dateFilter]}`;
      }
    }

    // @ts-ignore
    const reqInstance = typeof window === 'undefined' ? eval('require') : null;
    const playwright = reqInstance('playwright-extra');
    const stealthPlugin = reqInstance('puppeteer-extra-plugin-stealth');
    playwright.chromium.use(stealthPlugin());
    
    const browser = await playwright.chromium.launch({ headless: true });
    
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();
      
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      
      try {
        await page.waitForSelector('.job_seen_beacon', { timeout: 5000 });
      } catch (e) {
        console.warn('Indeed Scraper: Timeout or CAPTCHA block. Returning empty.');
        return [];
      }

      const jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.job_seen_beacon'));
        return cards.slice(0, 10).map(card => {
          const titleEl = card.querySelector('.jobTitle span');
          const companyEl = card.querySelector('[data-testid="company-name"]');
          const locationEl = card.querySelector('[data-testid="text-location"]');
          const urlEl = card.querySelector('a.jcs-JobTitle') as HTMLAnchorElement;
          
          return {
            id: `ind-${Math.random().toString(36).substr(2, 9)}`,
            source: 'Indeed' as const,
            title: titleEl?.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown Company',
            location: locationEl?.textContent?.trim() || 'Unknown Location',
            description: 'Apply on Indeed to see description.',
            url: urlEl?.href || '',
            postedAt: new Date().toISOString().split('T')[0],
            logo: ''
          };
        });
      });

      return jobs;
    } catch (error) {
      console.error('Indeed Scraping error:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}
