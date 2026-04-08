import { Job, JobSource } from "../types";
import { JobTechService } from "./scrapers/jobtech";
import { TheHubScraper } from "./scrapers/the-hub";
import { LinkedInScraper } from "./scrapers/linkedin";
import { IndeedScraper } from "./scrapers/indeed";

export class JobService {
  /**
   * Fetches jobs from multiple Scandinavian sources.
   * Aggregates results from JobTech (official), The Hub (startups), LinkedIn, and Indeed.
   */
  static async fetchAllJobs(location: string = 'Stockholm', query: string = 'Graphic Designer'): Promise<Job[]> {
    try {
      // Run searchers in parallel and catch any failing ones so others still execute
      const [jobTechJobs, theHubJobs, linkedinJobs, indeedJobs] = await Promise.all([
        JobTechService.search(query, location).catch(() => []),
        TheHubScraper.scrape(query, location).catch(() => []),
        LinkedInScraper.scrape(query, location).catch(() => []),
        IndeedScraper.scrape(query, location).catch(() => [])
      ]);

      // Combine and sort by date or match score
      const allJobs = [...jobTechJobs, ...theHubJobs, ...linkedinJobs, ...indeedJobs];
      
      // Calculate match scores (placeholder for now, will call AI later)
      return allJobs.map(job => ({
        ...job,
        matchScore: job.matchScore || Math.floor(Math.random() * 30) + 65
      })).sort((a, b) => b.matchScore! - a.matchScore!);
      
    } catch (error) {
      console.error('Aggregator Fetch Error:', error);
      return [];
    }
  }
}
