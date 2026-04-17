import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';

export async function POST(req: NextRequest) {
  try {
    const { job, jobDescription, targetLanguage = 'English' } = await req.json();

    const profile = ProfileService.getProfile();
    const baseCv = profile?.baseCv || profile?.baseCvPath || '';

    if (!baseCv || baseCv.length < 30) {
      return NextResponse.json(
        { error: 'Please add your base CV first in the Profile page.' },
        { status: 400 }
      );
    }

    const jobTitle  = job?.title   || 'the position';
    const company   = job?.company || 'your company';
    const location  = job?.location || '';
    const desc      = (jobDescription || job?.description || '').slice(0, 2500);
    const cvExcerpt = baseCv.slice(0, 4000);

    const languageNote = targetLanguage !== 'English'
      ? `Write the ENTIRE letter in ${targetLanguage}.`
      : 'Write in English unless the job is clearly in Swedish/Norwegian/Danish/Polish/German/French — then match that language.';

    const systemPrompt = `You are an expert career coach. Write professional, compelling cover letters. Output ONLY the cover letter text — no subject line, no preamble.`;

    const userPrompt = `Write a professional cover letter for this application.

POSITION: ${jobTitle} at ${company}${location ? ` — ${location}` : ''}
JOB DESCRIPTION:
${desc || 'Not provided — write a strong general cover letter based on the candidate profile.'}

CANDIDATE PROFILE:
${cvExcerpt}

LANGUAGE: ${languageNote}

RULES:
1. Open with a strong hook — NOT "I am writing to apply for...".
2. Three paragraphs: (a) Why this company/role, (b) Top 2-3 achievements with impact, (c) Forward-looking close with call to action.
3. Professional but warm tone. Max 350 words. No bullets — flowing prose.
4. Sign off with the candidate's name from the profile.
5. Start with salutation "Dear ${company} Team," or similar. Go straight into letter — no address block.`;

    let letter = '';

    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: 900,
        temperature: 0.5,
      });
      letter = res.choices[0].message.content || '';
    } else if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      // @ts-ignore
      letter = res.content[0].text || '';
    } else {
      return NextResponse.json({ error: 'No AI API key configured.' }, { status: 500 });
    }

    return NextResponse.json({ letter, jobTitle, company });
  } catch (err: any) {
    console.error('[generate-cover-letter]', err);
    return NextResponse.json({ error: err.message || 'Failed to generate cover letter' }, { status: 500 });
  }
}
