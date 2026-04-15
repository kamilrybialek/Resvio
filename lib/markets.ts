export type MarketId = 'scandinavia' | 'uk' | 'central_europe' | 'southern_europe' | 'all_europe';

export interface MarketConfig {
  id: MarketId;
  label: string;
  shortLabel: string;
  flags: string[];
  indeedTlds: string[];           // TLDs for Indeed scraper
  defaultLocations: string[];     // Autocomplete suggestions
  externalLinks: { name: string; url: (q: string, l: string) => string }[];
  cvLanguageHint: string;         // Hint for CV generation
}

export const MARKETS: MarketConfig[] = [
  {
    id: 'scandinavia',
    label: 'Scandinavia',
    shortLabel: 'Scandinavia',
    flags: ['🇸🇪', '🇳🇴', '🇩🇰'],
    indeedTlds: ['se', 'no', 'dk'],
    defaultLocations: [
      'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro', 'Västerås', 'Helsingborg',
      'Oslo', 'Bergen', 'Trondheim', 'Stavanger',
      'Copenhagen', 'Aarhus', 'Odense',
    ],
    externalLinks: [
      { name: 'LinkedIn',           url: (q, l) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'Indeed SE',          url: (q, l) => `https://se.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'Arbetsförmedlingen', url: (q)    => `https://arbetsformedlingen.se/platsbanken/annonser?q=${encodeURIComponent(q)}` },
      { name: 'The Hub',            url: (q)    => `https://thehub.io/jobs?search=${encodeURIComponent(q)}` },
      { name: 'Blocket Jobb',       url: (q)    => `https://jobb.blocket.se/?q=${encodeURIComponent(q)}` },
      { name: 'FINN.no',            url: (q, l) => `https://www.finn.no/job/fulltime/search.html?q=${encodeURIComponent(q)}` },
      { name: 'Jobnet.dk',          url: (q, l) => `https://job.jobnet.dk/CV/FindWork?SearchString=${encodeURIComponent(q)}` },
    ],
    cvLanguageHint: 'Detect job language (Swedish/Norwegian/Danish/English)',
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    shortLabel: 'UK',
    flags: ['🇬🇧'],
    indeedTlds: ['co.uk'],
    defaultLocations: [
      'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
      'Bristol', 'Edinburgh', 'Cardiff', 'Sheffield', 'Newcastle', 'Nottingham',
      'Remote (UK)',
    ],
    externalLinks: [
      { name: 'LinkedIn',   url: (q, l) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'Indeed UK',  url: (q, l) => `https://uk.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'Reed.co.uk', url: (q, l) => `https://www.reed.co.uk/jobs/${encodeURIComponent(q).replace(/%20/g,'-')}-jobs-in-${encodeURIComponent(l).replace(/%20/g,'-')}` },
      { name: 'Totaljobs',  url: (q, l) => `https://www.totaljobs.com/jobs/${encodeURIComponent(q).replace(/%20/g,'-')}/in-${encodeURIComponent(l).replace(/%20/g,'-')}` },
      { name: 'CW Jobs',    url: (q, l) => `https://www.cwjobs.co.uk/jobs/${encodeURIComponent(q).replace(/%20/g,'-')}/in-${encodeURIComponent(l).replace(/%20/g,'-')}` },
    ],
    cvLanguageHint: 'Write CV in English (UK)',
  },
  {
    id: 'central_europe',
    label: 'Central Europe',
    shortLabel: 'Central EU',
    flags: ['🇵🇱', '🇩🇪', '🇨🇿', '🇦🇹', '🇨🇭'],
    indeedTlds: ['de', 'pl', 'cz', 'at', 'ch'],
    defaultLocations: [
      // Poland
      'Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź', 'Katowice',
      // Germany
      'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf',
      // Czech Republic
      'Prague', 'Brno', 'Ostrava',
      // Austria / Switzerland
      'Vienna', 'Zurich', 'Bern',
    ],
    externalLinks: [
      { name: 'LinkedIn',    url: (q, l) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'JustJoinIT',  url: (q)    => `https://justjoin.it/job-offers?search=${encodeURIComponent(q)}` },
      { name: 'RocketJobs',  url: (q, l) => `https://rocketjobs.pl/job-offers?search[keywords]=${encodeURIComponent(q)}&search[city]=${encodeURIComponent(l)}` },
      { name: 'Indeed DE',   url: (q, l) => `https://de.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'Pracuj.pl',   url: (q, l) => `https://www.pracuj.pl/praca/${encodeURIComponent(q)};kw/${encodeURIComponent(l)};wp` },
      { name: 'StepStone',   url: (q, l) => `https://www.stepstone.de/jobs/${encodeURIComponent(q).replace(/%20/g,'-')}?where=${encodeURIComponent(l)}` },
      { name: 'NoFluffJobs', url: (q)    => `https://nofluffjobs.com/pl/jobs?criteria=requirement%3D${encodeURIComponent(q)}` },
    ],
    cvLanguageHint: 'Detect job language (German/Polish/Czech/English)',
  },
  {
    id: 'southern_europe',
    label: 'Southern Europe',
    shortLabel: 'South EU',
    flags: ['🇪🇸', '🇮🇹', '🇫🇷', '🇵🇹', '🇬🇷'],
    indeedTlds: ['es', 'it', 'fr', 'pt', 'gr'],
    defaultLocations: [
      // Spain
      'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao',
      // Italy
      'Milan', 'Rome', 'Turin', 'Naples', 'Bologna',
      // France
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux',
      // Portugal
      'Lisbon', 'Porto',
      // Greece
      'Athens',
    ],
    externalLinks: [
      { name: 'LinkedIn',        url: (q, l) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'Indeed ES',       url: (q, l) => `https://es.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'InfoJobs',        url: (q, l) => `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${encodeURIComponent(q)}&normalizedLocationId=${encodeURIComponent(l)}` },
      { name: 'Welcome to Jungle', url: (q, l) => `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(q)}&refinementList%5Boffices.country_code%5D%5B0%5D=FR` },
      { name: 'Indeed FR',       url: (q, l) => `https://fr.indeed.com/emplois?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'Indeed IT',       url: (q, l) => `https://it.indeed.com/lavoro?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
    ],
    cvLanguageHint: 'Detect job language (Spanish/Italian/French/Portuguese/English)',
  },
  {
    id: 'all_europe',
    label: 'All Europe',
    shortLabel: 'All Europe',
    flags: ['🇪🇺'],
    indeedTlds: ['se', 'no', 'dk', 'co.uk', 'de', 'pl', 'es', 'it', 'fr'],
    defaultLocations: [
      'Remote (Europe)', 'London', 'Berlin', 'Paris', 'Amsterdam',
      'Stockholm', 'Oslo', 'Copenhagen', 'Warsaw', 'Barcelona', 'Milan',
      'Vienna', 'Zurich', 'Dublin', 'Brussels', 'Prague',
    ],
    externalLinks: [
      { name: 'LinkedIn',        url: (q, l) => `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'EuroJobs',        url: (q, l) => `https://www.eurojobs.com/?action=search&q=${encodeURIComponent(q)}&location=${encodeURIComponent(l)}` },
      { name: 'Glassdoor',       url: (q, l) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}&locT=C&locId=0` },
      { name: 'Indeed',          url: (q, l) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}` },
      { name: 'Welcome to Jungle', url: (q, l) => `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(q)}` },
    ],
    cvLanguageHint: 'Detect job language and write CV in that language',
  },
];

export const DEFAULT_MARKET_ID: MarketId = 'scandinavia';

export function getMarket(id: MarketId): MarketConfig {
  return MARKETS.find(m => m.id === id) ?? MARKETS[0];
}
