import { Job } from '../../types';
import axios from 'axios';

export class JobTechService {
  private static API_URL = 'https://jobsearch.api.jobtechdev.se/search';

  static async search(query: string = 'Grafisk formgivare', location: string = 'Stockholm'): Promise<Job[]> {
    try {
      const response = await axios.get(this.API_URL, {
        params: {
          q: query,
          l: location,
          limit: 10
        }
      });

      const ads = response.data.hits || [];
      
      return ads.map((ad: any) => ({
        id: `af-${ad.id}`,
        source: 'Arbetsförmedlingen',
        title: ad.headline,
        company: ad.employer.name,
        location: ad.workplace_address.municipality || location,
        description: ad.description.text,
        url: ad.application_details.url || `https://arbetsformedlingen.se/platsbanken/annonser/${ad.id}`,
        postedAt: ad.publication_date.split('T')[0],
        logo: '' // JobTech usually doesn't provide logos directly
      }));
    } catch (error) {
      console.error('Error fetching from JobTech API:', error);
      return [];
    }
  }
}
