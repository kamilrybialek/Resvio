import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resvio — AI-Powered Job Search for Europe',
  description: 'Search LinkedIn, Indeed, JustJoinIT and 10+ European job boards at once. AI tailors your CV and writes cover letters for every application. Get hired faster.',
  keywords: ['job search', 'AI CV', 'cover letter', 'Europe jobs', 'LinkedIn scraper', 'resume builder', 'job application', 'Sweden jobs', 'Poland jobs', 'Germany jobs'],
  authors: [{ name: 'Resvio' }],
  openGraph: {
    title: 'Resvio — AI-Powered Job Search for Europe',
    description: 'One search. 10+ job boards. AI-tailored CV for every application.',
    url: 'https://resvio.online',
    siteName: 'Resvio',
    locale: 'en_EU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resvio — AI-Powered Job Search for Europe',
    description: 'One search. 10+ job boards. AI-tailored CV for every application.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://resvio.online',
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
