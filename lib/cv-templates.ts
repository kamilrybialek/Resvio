export type TemplateId = 'minimal' | 'sidebar' | 'grid';

export interface CvTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  sectionOrder: string[];
  layoutHint: string;
}

export const CV_TEMPLATES: CvTemplate[] = [
  {
    id: 'minimal',
    name: 'Executive',
    tagline: 'One-column · Blue accents · ATS-safe',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Clean one-column layout with a gradient top accent strip. Large name header with blue job title and contact dots separated by pipes. Section headers are small-caps uppercase with a thin horizontal rule extending to the right. Experience entries show company name bold with dates right-aligned, italic job title below, and bullet points with blue arrow markers (▸). Skills shown as comma-separated text. Very professional and ATS-friendly.',
  },
  {
    id: 'sidebar',
    name: 'Nordic Premium',
    tagline: 'Dark navy sidebar · Gold accents · Premium',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Two-column premium layout. Left dark navy sidebar (66mm) contains: circular initials avatar with gold ring, name in white bold, job title in gold uppercase, contact with diamond bullet markers, SKILLS & COMPETENCIES and LANGUAGES sections. Right white main column contains PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE (with company, dates, italic title, dash bullets), and EDUCATION. Gold accent (#c89a46) used throughout sidebar for titles and markers. Section headers in main column have a small left gold accent bar.',
  },
  {
    id: 'grid',
    name: 'Atlas',
    tagline: 'Full-width header · Two-column body · Modern',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Deep navy full-width header band containing name (large white 22pt), job title (light blue uppercase), and contact info aligned to the right. Optional PROFESSIONAL SUMMARY appears as a subtle light-blue tinted bar below the header. Body: left column 60% for PROFESSIONAL EXPERIENCE (company bold, dates, italic title in blue, arrow bullet points), right column 40% for EDUCATION (degree bold, school, dates), SKILLS as small tag chips (rounded pill badges in light blue), and LANGUAGES as plain text. Blue accent (#2563eb) used for section headers, skill tags, and bullet markers.',
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = 'sidebar';
