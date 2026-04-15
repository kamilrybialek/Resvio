import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { Job } from '@/lib/types';

function detectLanguage(text: string): 'pl' | 'en' | 'sv' | 'de' {
  const t = text.toLowerCase();
  const pl = (t.match(/\b(praca|stanowisko|wymagania|oferta|umiejętności|doświadczenie|aplikuj|firma)\b/g) || []).length;
  const sv = (t.match(/\b(arbete|tjänst|ansök|erfarenhet|företag|söker|krav)\b/g) || []).length;
  const de = (t.match(/\b(stelle|arbeit|erfahrung|kenntnisse|bewerbung|unternehmen|anforderungen)\b/g) || []).length;
  if (pl >= 2) return 'pl';
  if (sv >= 2) return 'sv';
  if (de >= 2) return 'de';
  return 'en';
}

const GDPR_NOTES: Record<string, string> = {
  pl: 'Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w niniejszym dokumencie dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z Ustawą o ochronie danych osobowych z dnia 10 maja 2018 r. (Dz.U.2018 poz.1000).',
  en: '',
  sv: '',
  de: '',
};

export async function POST(req: NextRequest) {
  try {
    const { job, customNote }: { job: Job; customNote?: string } = await req.json();
    if (!job) return NextResponse.json({ error: 'Job data required' }, { status: 400 });

    const profile = ProfileService.getProfile();
    if (!profile?.name) {
      return NextResponse.json({ error: 'Please complete your profile first.' }, { status: 400 });
    }

    const lang = detectLanguage(
      (job.title + ' ' + job.description + ' ' + job.company).slice(0, 2000),
    );

    const langInstructions: Record<string, string> = {
      pl: 'Write the cover letter in Polish (język polski). Use formal "Pan/Pani" style.',
      en: 'Write the cover letter in English.',
      sv: 'Write the cover letter in Swedish (svenska).',
      de: 'Write the cover letter in German (Deutsch). Use formal "Sie" form.',
    };

    const profileSummary = [
      profile.baseCv || '',
      profile.skills?.length ? `Skills: ${profile.skills.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 3000);

    const prompt = `You are an expert at writing compelling cover letters tailored to specific job offers.

${langInstructions[lang]}

CANDIDATE PROFILE:
Name: ${profile.name}
Email: ${profile.email || ''}
Phone: ${profile.phone || ''}
${profileSummary}

JOB OFFER:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description:
${job.description?.slice(0, 2000) || 'No description provided.'}

${customNote ? `Additional note from candidate: ${customNote}` : ''}

Write a professional, engaging cover letter (3–4 paragraphs) that:
1. Opens with a strong hook connecting the candidate to the specific company and role
2. Highlights 2–3 most relevant skills/experiences matching the job requirements
3. Shows genuine enthusiasm and cultural fit for the company
4. Closes with a confident call to action

Format: Plain text, no headers, no "Dear Hiring Manager" boilerplate — use the company name specifically.
Do NOT add any greetings/signatures — just the body paragraphs.
${GDPR_NOTES[lang] ? `\nEnd with this GDPR note on a new line:\n${GDPR_NOTES[lang]}` : ''}`;

    // Try Anthropic first, then OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || '';
        if (text) {
          return NextResponse.json({
            coverLetter: text.trim(),
            language: lang,
          });
        }
      }
    }

    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) {
          return NextResponse.json({
            coverLetter: text.trim(),
            language: lang,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'No AI API key configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY.' },
      { status: 503 },
    );
  } catch (err) {
    console.error('Cover letter generation error:', err);
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 });
  }
}
