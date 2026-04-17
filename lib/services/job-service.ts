import { Job } from "../types";
import { MarketId, getMarket } from "../markets";
import { JobTechService } from "./scrapers/jobtech";
import { TheHubScraper } from "./scrapers/the-hub";
import { LinkedInScraper } from "./scrapers/linkedin";
import { IndeedScraper } from "./scrapers/indeed";
import { JustJoinITScraper } from "./scrapers/justjoinit";
import { RocketJobsScraper } from "./scrapers/rocketjobs";
import { AdzunaService } from "./scrapers/adzuna";
import { JoobleService } from "./scrapers/jooble";
import { ReedService } from "./scrapers/reed";
import { NoFluffJobsScraper } from "./scrapers/nofluffjobs";
import { FinnScraper } from "./scrapers/finn";

/**
 * Sources that use Playwright browser automation.
 * These only work locally / on NAS — not on Vercel.
 * They are shown in the UI with a "DEV" badge.
 */
export const SCRAPER_SOURCES = new Set<string>(['LinkedIn', 'Indeed']);

function isRemoteSearch(location: string): boolean {
  const l = location.toLowerCase();
  return l === 'remote' || l === 'zdalne' || l === 'remote (europe)' || l === 'remote (poland)' || l === 'remote (uk)';
}

export class JobService {
  /**
   * Fetches jobs from sources appropriate for the selected market.
   * Official APIs run on all environments; Playwright scrapers are local-only.
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

      // ── Scandinavian official APIs ────────────────────────────────────────
      if (market === 'scandinavia' || market === 'all_europe') {
        promises.push(
          // Swedish public job board (best coverage for SE)
          JobTechService.search(query, location, page, dateFilter).catch(() => []),
          // Scandinavian startup jobs
          TheHubScraper.scrape(query, location, page, dateFilter).catch(() => []),
          // Norway: Finn.no
          FinnScraper.scrape(query, location, page, dateFilter).catch(() => []),
          // Adzuna: covers SE, NO, DK (requires ADZUNA_APP_ID + ADZUNA_APP_KEY)
          AdzunaService.search(query, location, page, dateFilter).catch(() => []),
          // Jooble: covers all Scandinavian + EU (requires JOOBLE_API_KEY)
          JoobleService.search(query, location, page, dateFilter).catch(() => []),
        );
      }

      // ── Central Europe / Polish official APIs ─────────────────────────────
      if (market === 'central_europe' || market === 'all_europe') {
        promises.push(
          JustJoinITScraper.scrape(query, location, page, dateFilter).catch(() => []),
          RocketJobsScraper.scrape(query, location, page, dateFilter).catch(() => []),
          NoFluffJobsScraper.scrape(query, location, page, dateFilter).catch(() => []),
          // Adzuna: covers DE, PL, AT, NL, FR, ES, IT, BE (requires keys)
          AdzunaService.search(query, location, page, dateFilter).catch(() => []),
          // Jooble: wide coverage (requires key)
          JoobleService.search(query, location, page, dateFilter).catch(() => []),
        );
      }

      // ── UK official APIs ──────────────────────────────────────────────────
      if (market === 'uk') {
        promises.push(
          // Reed.co.uk API (requires REED_API_KEY)
          ReedService.search(query, location, page, dateFilter).catch(() => []),
          // Adzuna: strong UK coverage (requires keys)
          AdzunaService.search(query, location, page, dateFilter).catch(() => []),
          // Jooble: UK coverage
          JoobleService.search(query, location, page, dateFilter).catch(() => []),
        );
      }

      // ── Southern Europe ───────────────────────────────────────────────────
      if (market === 'southern_europe') {
        promises.push(
          AdzunaService.search(query, location, page, dateFilter).catch(() => []),
          JoobleService.search(query, location, page, dateFilter).catch(() => []),
        );
      }

      // ── All Europe: Jooble + Adzuna as universal aggregators ─────────────
      if (market === 'all_europe') {
        promises.push(
          ReedService.search(query, location, page, dateFilter).catch(() => []),
        );
      }

      // ── Playwright scrapers (local/NAS only — shown as DEV in UI) ─────────
      // LinkedIn works for all markets
      promises.push(
        LinkedInScraper.scrape(query, location, page, dateFilter).catch(() => [])
      );

      // Indeed — market-specific TLDs
      const tlds = remote
        ? marketConfig.indeedTlds.slice(0, 3)
        : marketConfig.indeedTlds.slice(0, market === 'all_europe' ? 3 : 2);

      for (const tld of tlds) {
        promises.push(
          IndeedScraper.scrape(query, location, page, dateFilter, tld).catch(() => [])
        );
      }

      // Remote-only: also query JustJoinIT remote for non-Polish markets
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
