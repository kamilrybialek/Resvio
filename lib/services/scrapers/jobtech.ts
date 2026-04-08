import { Job } from '../../types';
import axios from 'axios';

export class JobTechService {
  private static API_URL = 'https://jobsearch.api.jobtechdev.se/search';

  static async search(query: string = 'Grafisk formgivare', location: string = 'Stockholm', page: number = 1, dateFilter: string = ''): Promise<Job[]> {
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      
      const params: any = {
        q: query,
        l: location,
        limit: limit,
        offset: offset
      };

      if (dateFilter && dateFilter !== 'any') {
        const now = new Date();
        if (dateFilter === '24h') now.setDate(now.getDate() - 1);
        else if (dateFilter === '7d') now.setDate(now.getDate() - 7);
        else if (dateFilter === '30d') now.setDate(now.getDate() - 30);
        
        params['published-after'] = now.toISOString().split('.')[0]; // Format: YYYY-MM-DDTHH:MM:SS
      }

      const response = await axios.get(this.API_URL, { params });

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
