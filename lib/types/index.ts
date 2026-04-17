export type JobSource =
  | 'Arbetsförmedlingen'
  | 'The Hub'
  | 'LinkedIn'
  | 'Indeed'
  | 'Blocket'
  | 'JustJoinIT'
  | 'RocketJobs'
  | 'Adzuna'
  | 'Jooble'
  | 'Reed'
  | 'NoFluffJobs'
  | 'Finn'
  | 'Other';

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
  baseCv?: string; // The raw text
  portfolioUrl?: string;
  portfolio?: string;
  skills: string[];
  appliedJobs?: string[]; // IDs of applied jobs
  photoBase64?: string; // Base64-encoded profile photo (JPEG/PNG)
  // ── Subscription ──────────────────────────────────────────────────────────
  subscription?: {
    plan: 'free' | 'starter' | 'growth' | 'pro';
    cvCredits: number;          // remaining AI CV generations
    expiresAt?: string;         // ISO date, undefined = never expires (credit-based)
    activatedAt?: string;       // ISO date of purchase
  };
}
