export type JobSource = 'Arbetsförmedlingen' | 'The Hub' | 'LinkedIn' | 'Indeed' | 'Blocket' | 'Other';

export interface Job {
  id: string;
  source: JobSource;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedAt: string;
  salary?: string;
  matchScore?: number;
  tags?: string[];
  logo?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  baseCvPath: string; // Markdown or PDF
  portfolioUrl?: string;
  skills: string[];
  appliedJobs?: string[]; // IDs of applied jobs
}
