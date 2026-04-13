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
    name: 'Minimal Classic',
    tagline: 'Clean · ATS-safe · One page',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Minimal clean layout. Narrow left column shows uppercase section labels; wide right column shows the content. No sidebar. All sections flow top to bottom.',
  },
  {
    id: 'sidebar',
    name: 'Nordic Sidebar',
    tagline: 'Premium · Dark sidebar · Scandinavian',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'PROFESSIONAL EXPERIENCE',
      'EDUCATION',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Two-column layout. Left dark sidebar contains SKILLS & COMPETENCIES and LANGUAGES. Right main column contains PROFESSIONAL SUMMARY, PROFESSIONAL EXPERIENCE, and EDUCATION.',
  },
  {
    id: 'grid',
    name: 'Modern Grid',
    tagline: 'Structured · Side-by-side · Contemporary',
    sectionOrder: [
      'PROFESSIONAL SUMMARY',
      'EDUCATION',
      'PROFESSIONAL EXPERIENCE',
      'SKILLS & COMPETENCIES',
      'LANGUAGES',
    ],
    layoutHint:
      'Grid layout. Top block: name and summary. Middle row: EDUCATION on the left column, PROFESSIONAL EXPERIENCE on the right column. Bottom full-width row: SKILLS & COMPETENCIES and LANGUAGES.',
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = 'sidebar';
