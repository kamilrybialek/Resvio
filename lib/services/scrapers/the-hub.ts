import { Job } from '../../types';

export class TheHubScraper {
  static async scrape(query: string = 'Graphic Designer', location: string = 'Sweden', page: number = 1, dateFilter: string = ''): Promise<Job[]> {
    if (process.env.VERCEL === '1') {
      console.warn("The Hub scraper disabled on Vercel.");
      return [];
    }

    // Construct search URL (example format for The Hub)
    // Note: The Hub might not support direct page/date params in the URL easily without more research, 
    // but we pass them for consistency.
    let url = `https://thehub.io/jobs?search=${encodeURIComponent(query)}&countryCode=${location === 'Sweden' ? 'SE' : 'DK'}`;
    if (page > 1) {
      url += `&page=${page}`;
    }
    
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      
      // Wait for job cards - use short timeout and catch if it fails
      try {
        await page.waitForSelector('.job-card', { timeout: 3000 });
      } catch (timeout) {
        console.warn('The Hub Scraper: Timeout waiting for .job-card. The page structure might have changed or there are no results.');
        return [];
      }
      
      const jobs = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.job-card'));
        return cards.map(card => {
          const titleEl = card.querySelector('.job-card__title');
          const companyEl = card.querySelector('.job-card__company-name');
          const locationEl = card.querySelector('.job-card__location');
          const logoEl = card.querySelector('.job-card__company-logo img') as HTMLImageElement;
          const urlEl = card.querySelector('a') as HTMLAnchorElement;
          
          return {
            id: `th-${Math.random().toString(36).substr(2, 9)}`,
            source: 'The Hub' as const,
            title: titleEl?.textContent?.trim() || 'Unknown Title',
            company: companyEl?.textContent?.trim() || 'Unknown Company',
            location: locationEl?.textContent?.trim() || 'Unknown Location',
            description: '', // Need to visit job page for full description
            url: urlEl?.href || '',
            postedAt: new Date().toISOString().split('T')[0],
            logo: logoEl?.src || ''
          };
        });
      });
      
      return jobs;
    } catch (error) {
      console.error('Error scraping The Hub:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}
