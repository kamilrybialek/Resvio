import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { CV_TEMPLATES, DEFAULT_TEMPLATE_ID, TemplateId } from '@/lib/cv-templates';
import { Job } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const {
      job,
      manualDescription,
      templateId,
    }: { job: Job; manualDescription?: string; templateId?: TemplateId } = await req.json();

    if (!job) {
      return NextResponse.json({ error: 'Job data required' }, { status: 400 });
    }

    const profile = ProfileService.getProfile();
    const baseCv = profile?.baseCv || profile?.baseCvPath || '';

    if (!baseCv || baseCv.length < 30) {
      return NextResponse.json(
        { error: 'Please add your base CV first in the Profile page before generating a tailored CV.' },
        { status: 400 }
      );
    }

    const template =
      CV_TEMPLATES.find((t) => t.id === (templateId || DEFAULT_TEMPLATE_ID)) ??
      CV_TEMPLATES[1];

    const jobDescription = (manualDescription || job.description || '').slice(0, 2000);
    const cvProfile = baseCv.slice(0, 5000);
    const provider: 'openai' | 'anthropic' = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';

    const systemPrompt = `You are an expert CV writer for the Scandinavian job market. You produce ATS-optimized, GDPR-compliant, one-page CVs in Markdown. Output ONLY the CV Markdown — no preamble, no explanations.`;

    const userPrompt = `Write a tailored CV using the candidate profile below.

JOB: ${job.title} at ${job.company}${job.location ? ` — ${job.location}` : ''}
${jobDescription}

TEMPLATE: ${template.name}
Layout: ${template.layoutHint}
Section order: ${template.sectionOrder.join(' → ')}

CANDIDATE PROFILE:
${cvProfile}

RULES:
1. LANGUAGE — Detect job offer language (English/Swedish/Polish/Norwegian/Danish) and write entire CV in that language.
2. ACCURACY — Use ONLY facts from CANDIDATE PROFILE. Never invent, assume, or extrapolate.
3. PROFESSIONAL TITLE (## line) — Use the candidate's OWN professional title/role from their profile (e.g. "Software Engineer", "UX Designer"). Do NOT use the target job title as the professional title. The target job keywords should appear naturally in the SUMMARY instead.
4. ATS SUMMARY — First sentence of summary must naturally reference the target role and mirror 2–3 key requirements from the job description (only when truthful about the candidate).
5. BULLETS — Format: [Action verb] + [scope/task] + [result]. No verb repeated more than twice. Most recent role: 4–5 bullets. Older roles: 2–3 bullets. Skip roles >7 years old.
6. DATES — Always MM/YYYY — MM/YYYY. Active role: MM/YYYY — Present.
7. ONE PAGE — Summary: 2–3 sentences. Skills: max 12, comma-separated. Education: 1 line per entry.
8. GDPR — No DOB, nationality, gender, photo, ID, home address. End with the following GDPR consent footer (translate only if CV language is Swedish/Norwegian/Danish — for English and Polish use the exact text below):
   - Polish/English CV: "*I agree to the processing of personal data provided in this document for realising the recruitment process pursuant to the Personal Data Protection Act of 10 May 2018 (Journal of Laws 2018, item 1000) and in agreement with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation).*"
   - Swedish CV: "*Jag samtycker till behandling av mina personuppgifter i rekryteringssyfte enligt GDPR (EU) 2016/679.*"
   - Norwegian CV: "*Jeg samtykker til behandling av mine personopplysninger for rekrutteringsformål i henhold til GDPR (EU) 2016/679.*"
   - Danish CV: "*Jeg accepterer behandling af mine personoplysninger med henblik på rekrutteringsprocessen i henhold til GDPR (EU) 2016/679.*"

OUTPUT FORMAT:
# [Full Name]
## [Candidate's own professional title from their profile]
CONTACT: [Email] | [Phone] | [City, Country] | [LinkedIn if available]

## PROFESSIONAL SUMMARY
[2–3 sentences. Reference the target role naturally. Do NOT start with "I am applying for..."]

## PROFESSIONAL EXPERIENCE
### [Title] | [Company] | [MM/YYYY — MM/YYYY]
[City]
- [bullet]

## EDUCATION
### [Degree] | [Institution] | [YYYY]

## SKILLS & COMPETENCIES
[skill1], [skill2], ... (max 12)

## LANGUAGES
[Language]: [Level]

---
*[GDPR consent — use exact text from rule 8 matching CV language]*`;

    let tailoredCv = '';

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2200,
        temperature: 0.3,
      });
      tailoredCv = response.choices[0].message.content || '';
    } else if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2200,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      // @ts-ignore
      tailoredCv = response.content[0].text;
    } else {
      return NextResponse.json({ error: 'No AI API key configured.' }, { status: 500 });
    }

    return NextResponse.json({ tailoredCv });
  } catch (error: any) {
    console.error('Generate CV error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate CV' }, { status: 500 });
  }
}
