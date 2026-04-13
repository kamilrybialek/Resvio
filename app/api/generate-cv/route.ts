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

    const jobDescription = manualDescription || job.description || 'No description provided.';
    const provider: 'openai' | 'anthropic' = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';

    const prompt = `You are a professional CV generation agent. Your sole task is to produce a single, ATS-optimized, GDPR-compliant CV in Markdown format.

═══════════════════════════════════════════════════════════════
INPUTS
═══════════════════════════════════════════════════════════════

[JOB_OFFER]
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description:
${jobDescription}

[CV_TEMPLATE: ${template.name}]
Layout: ${template.layoutHint}
Section order: ${template.sectionOrder.join(' → ')}

[USER_PROFILE]
${baseCv}

═══════════════════════════════════════════════════════════════
GENERATION RULES
═══════════════════════════════════════════════════════════════

LANGUAGE:
Detect the language of [JOB_OFFER] and write the ENTIRE CV in that language.
If the offer is in Swedish → CV in Swedish.
If in English → CV in English.
If in Polish → CV in Polish.

DATA INTEGRITY (CRITICAL):
- Use ONLY data present in [USER_PROFILE] — NEVER invent, assume, or interpolate
- Every fact must be traceable to [USER_PROFILE]
- Missing template fields: leave blank, do NOT mention them in the output

ATS OPTIMIZATION:
- The EXACT job title from [JOB_OFFER] must appear in:
    (1) the header title line (## line)
    (2) the first sentence of PROFESSIONAL SUMMARY
- Extract required hard skills, soft skills, certifications, and industry terms from [JOB_OFFER]
- For each keyword that has a factual basis in [USER_PROFILE]: inject it verbatim into the relevant section
- Bullet point format: [Strong Action Verb] + [Task or Scope] + [Quantified Result when available]
- No action verb repeated more than twice in the entire document
- Most recent role: 4–5 bullets | Roles 2–3: 2–3 bullets | Roles older than 7 years: omit entirely

DATES: Always MM/YYYY — MM/YYYY. Current role → MM/YYYY — Present

GDPR COMPLIANCE:
- Allowed: full name, professional email, phone, city + country, LinkedIn URL, portfolio URL
- Forbidden: date of birth, age, nationality, gender, photo, national ID, full home address
- Append the consent footer matching the CV language:
    English: "I consent to the processing of my personal data included in this CV for the purposes of the current recruitment process, in accordance with Regulation (EU) 2016/679 (GDPR)."
    Polish: "Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w tym CV na potrzeby aktualnego procesu rekrutacji, zgodnie z Rozporządzeniem (UE) 2016/679 (RODO)."
    Swedish: "Jag samtycker till behandlingen av mina personuppgifter i detta CV för rekryteringsändamål, i enlighet med förordning (EU) 2016/679 (GDPR)."

ONE-PAGE CONSTRAINT (STRICT):
- Target exactly 1 A4 page — do not exceed it
- PROFESSIONAL SUMMARY: 2–3 sentences only
- Include maximum 4–5 work experience entries (most recent / most relevant first)
- SKILLS & COMPETENCIES: comma-separated list, max 12 items, no sub-categories
- EDUCATION: 1–2 lines per entry only, no elaboration
- Omit roles older than 7 years entirely

═══════════════════════════════════════════════════════════════
REQUIRED OUTPUT FORMAT — follow exactly
═══════════════════════════════════════════════════════════════

# [FULL NAME]
## [Exact job title from JOB_OFFER]

CONTACT: [Email] | [Phone] | [City, Country] | [LinkedIn URL if available]

## PROFESSIONAL SUMMARY
[2–3 sentences. First sentence must contain the exact job title.]

## PROFESSIONAL EXPERIENCE

### [Job Title] | [Company] | [MM/YYYY — MM/YYYY or Present]
[City, Country]
- [Action verb + task + result/scope]
- [Action verb + task + result/scope]
- [Action verb + task + result/scope]

[Repeat for each relevant role, most recent first]

## EDUCATION

### [Degree] | [Institution] | [YYYY]

## SKILLS & COMPETENCIES
[Skill1], [Skill2], [Skill3], ... (max 12, comma-separated)

## LANGUAGES
[Language]: [Level], [Language]: [Level]

---
*[GDPR consent in detected CV language]*

═══════════════════════════════════════════════════════════════
QUALITY GATES — verify before output
═══════════════════════════════════════════════════════════════
[ ] Job title from JOB_OFFER appears in header (## line) and first sentence of summary
[ ] All action verbs unique (no verb repeated more than twice)
[ ] All dates in MM/YYYY format
[ ] No forbidden personal data included
[ ] No invented or assumed facts
[ ] GDPR footer present as last element
[ ] Fits within 1 A4 page (strict)
[ ] Only data from [USER_PROFILE] used

OUTPUT: Return the CV in Markdown ONLY — no preamble, no explanations, no metadata.`;

    let tailoredCv = '';

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
      });
      tailoredCv = response.choices[0].message.content || '';
    } else if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
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
