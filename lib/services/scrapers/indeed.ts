import { Job } from '../../types';

export class IndeedScraper {
  static async scrape(query: string, location: string, pageNumber: number = 1, dateFilter: string = '', forceTld?: string): Promise<Job[]> {
    if (process.env.VERCEL === '1') {
      console.warn("Indeed scraper disabled on Vercel.");
      return [];
    }

    const limit = 10;
    const start = (pageNumber - 1) * limit;

    // Determine TLD: explicit > location-based > default 'se'
    let tld: string;
    if (forceTld) {
      tld = forceTld;
    } else {
      const normalizedLoc = location.toLowerCase();
      if (normalizedLoc.includes('denmark') || normalizedLoc.includes('copenhagen') || normalizedLoc === 'dk') tld = 'dk';
      else if (normalizedLoc.includes('norway') || normalizedLoc.includes('oslo') || normalizedLoc === 'no') tld = 'no';
      else if (normalizedLoc.includes('germany') || normalizedLoc.includes('berlin') || normalizedLoc.includes('munich') || normalizedLoc.includes('frankfurt')) tld = 'de';
      else if (normalizedLoc.includes('poland') || normalizedLoc.includes('warsaw') || normalizedLoc.includes('kraków') || normalizedLoc.includes('wrocław')) tld = 'pl';
      else if (normalizedLoc.includes('uk') || normalizedLoc.includes('london') || normalizedLoc.includes('manchester') || normalizedLoc.includes('birmingham')) tld = 'co.uk';
      else if (normalizedLoc.includes('france') || normalizedLoc.includes('paris') || normalizedLoc.includes('lyon')) tld = 'fr';
      else if (normalizedLoc.includes('spain') || normalizedLoc.includes('madrid') || normalizedLoc.includes('barcelona')) tld = 'es';
      else if (normalizedLoc.includes('italy') || normalizedLoc.includes('milan') || normalizedLoc.includes('rome')) tld = 'it';
      else tld = 'se';
    }

    // UK indeed uses different URL structure
    const baseUrl = tld === 'co.uk'
      ? `https://uk.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`
      : `https://${tld}.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${start}`;
    let url = baseUrl;
    
    if (dateFilter && dateFilter !== 'any') {
      // Indeed's fromage param is in days (minimum 1). Sub-day filters get rounded up to 1.
      const fromageMap: Record<string, string> = {
        '1h':  '1',
        '2h':  '1',
        '4h':  '1',
        '12h': '1',
        '24h': '1',
        '48h': '2',
        '72h': '3',
        '7d':  '7',
        '14d': '14',
        '30d': '30',
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
            source: 'Indeed' as const,  // keep generic so SourceBadge works
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
