import { Job } from "../types";
import { MarketId, getMarket } from "../markets";
import { JobTechService } from "./scrapers/jobtech";
import { TheHubScraper } from "./scrapers/the-hub";
import { LinkedInScraper } from "./scrapers/linkedin";
import { IndeedScraper } from "./scrapers/indeed";
import { JustJoinITScraper } from "./scrapers/justjoinit";
import { RocketJobsScraper } from "./scrapers/rocketjobs";

function isRemoteSearch(location: string): boolean {
  const l = location.toLowerCase();
  return l === 'remote' || l === 'zdalne' || l === 'remote (europe)' || l === 'remote (poland)' || l === 'remote (uk)';
}

export class JobService {
  /**
   * Fetches jobs from sources appropriate for the selected market.
   */
  static async fetchAllJobs(
    location: string = 'Stockholm',
    query: string = 'Graphic Designer',
    page: number = 1,
    dateFilter: string = 'any',
    market: MarketId = 'scandinavia'
  ): Promise<Job[]> {
    try {
      const marketConfig = getMarket(market);
      const remote = isRemoteSearch(location);
      const promises: Promise<Job[]>[] = [];

      // ── Scandinavian sources ──────────────────────────────────────────────
      if (market === 'scandinavia' || market === 'all_europe') {
        promises.push(
          JobTechService.search(query, location, page, dateFilter).catch(() => []),
          TheHubScraper.scrape(query, location, page, dateFilter).catch(() => [])
        );
      }

      // ── Central Europe / Polish sources ───────────────────────────────────
      if (market === 'central_europe' || market === 'all_europe') {
        promises.push(
          JustJoinITScraper.scrape(query, location, page, dateFilter).catch(() => []),
          RocketJobsScraper.scrape(query, location, page, dateFilter).catch(() => [])
        );
      }

      // ── LinkedIn works for all markets ────────────────────────────────────
      promises.push(
        LinkedInScraper.scrape(query, location, page, dateFilter).catch(() => [])
      );

      // ── Indeed — market-specific TLDs ─────────────────────────────────────
      // For remote searches, use a broader set of TLDs
      const tlds = remote
        ? marketConfig.indeedTlds.slice(0, 3)
        : marketConfig.indeedTlds.slice(0, market === 'all_europe' ? 3 : 2);

      for (const tld of tlds) {
        promises.push(
          IndeedScraper.scrape(query, location, page, dateFilter, tld).catch(() => [])
        );
      }

      // ── Remote-only: also query JustJoinIT remote for any market ──────────
      if (remote && market !== 'central_europe' && market !== 'all_europe') {
        promises.push(
          JustJoinITScraper.scrape(query, 'Remote', page, dateFilter).catch(() => [])
        );
      }

      const results = await Promise.all(promises);
      const allJobs = results.flat();

      // Deduplicate by title+company (case-insensitive)
      const seen = new Set<string>();
      return allJobs.filter(job => {
        const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    } catch (error) {
      console.error('Aggregator Fetch Error:', error);
      return [];
    }
  }
}
