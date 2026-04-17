/**
 * Finn.no — Norway's largest job board
 * Uses their public search API (no API key required).
 * Endpoint: https://www.finn.no/api/search-qf (unofficial, reverse-engineered)
 *
 * Coverage: Norway only.
 */

import { Job } from '../../types';

interface FinnAd {
  ad_id: number;
  heading: string;
  location?: string;
  company_name?: string;
  logo_url?: string;
  published?: string;
  ad_link?: string;
  description?: string;
  job_title?: string;
  label?: string;
}

interface FinnResponse {
  docs?: FinnAd[];
  results?: FinnAd[];
  items?: FinnAd[];
}

export class FinnScraper {
  static async scrape(
    query: string,
    location: string,
    page: number = 1,
    dateFilter: string = 'any',
  ): Promise<Job[]> {
    try {
      // Finn.no public search API
      const params = new URLSearchParams({
        searchkey: 'JOB_FULL_TIME',
        q: query,
        ...(page > 1 ? { page: String(page) } : {}),
      });

      // Location mapping for Norwegian cities
      const loc = location.toLowerCase();
      if (loc.includes('oslo')) params.set('location', '0.20061');  // Oslo location code
      else if (loc.includes('bergen')) params.set('location', '0.20046');
      else if (loc.includes('trondheim')) params.set('location', '0.20054');
      else if (loc.includes('stavanger')) params.set('location', '0.20008');

      const res = await fetch(`https://www.finn.no/api/search-qf?${params}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-finn-device': 'desktop',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        // Fallback: try the REST API variant
        return FinnScraper.tryRestApi(query, location, page, dateFilter);
      }

      const data: FinnResponse = await res.json();
      const ads: FinnAd[] = data?.docs ?? data?.results ?? data?.items ?? [];

      if (!ads.length) return FinnScraper.tryRestApi(query, location, page, dateFilter);

      return FinnScraper.mapAds(ads, location);
    } catch {
      return FinnScraper.tryRestApi(query, location, page, dateFilter).catch(() => []);
    }
  }

  private static async tryRestApi(
    query: string,
    location: string,
    page: number,
    _dateFilter: string,
  ): Promise<Job[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        vertical: 'job',
        ...(page > 1 ? { from: String((page - 1) * 20) } : {}),
      });

      const res = await fetch(`https://www.finn.no/api/search?${params}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) return [];
      const data = await res.json();
      const ads: FinnAd[] = data?.docs ?? data?.results ?? [];
      return FinnScraper.mapAds(ads, location);
    } catch {
      return [];
    }
  }

  private static mapAds(ads: FinnAd[], fallbackLocation: string): Job[] {
    return ads.slice(0, 20).map((ad): Job => ({
      id: `finn-${ad.ad_id}`,
      source: 'Finn',
      title: ad.heading ?? ad.job_title ?? '',
      company: ad.company_name ?? 'Unknown',
      location: ad.location ?? fallbackLocation,
      description: ad.description ?? ad.label ?? '',
      url: ad.ad_link ?? `https://www.finn.no/job/fulltime/ad.html?finnkode=${ad.ad_id}`,
      postedAt: ad.published
        ? new Date(Number(ad.published) * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      logo: ad.logo_url,
      tags: [],
    }));
  }
}
