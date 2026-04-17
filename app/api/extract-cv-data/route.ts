import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/extract-cv-data
 * Accepts: { text: string }  — raw CV text (already parsed from PDF)
 * Returns: {
 *   name, email, phone, linkedin, portfolio,
 *   skills: string[],
 *   suggestedSkills: string[],
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || text.length < 30) {
      return NextResponse.json({ error: 'CV text too short' }, { status: 400 });
    }

    const cvExcerpt = text.slice(0, 5000);

    const systemPrompt = 'You are a CV data extractor. Output ONLY valid JSON, no markdown, no explanations.';
    const userPrompt = `Extract structured data from this CV text.

CV TEXT:
${cvExcerpt}

Return EXACTLY this JSON structure (empty string if not found, empty array if no skills):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+48 123 456 789",
  "linkedin": "https://linkedin.com/in/username",
  "portfolio": "https://example.com",
  "skills": ["skill1", "skill2", "skill3"],
  "suggestedSkills": ["skill_a", "skill_b", "skill_c"]
}

Rules for suggestedSkills:
- Suggest 5-8 skills NOT already in the CV but highly relevant to the candidate's field and experience level
- Base suggestions on industry norms, adjacent technologies, and career trajectory visible in the CV
- Only suggest realistic skills the person could credibly add after a short learning period
- Do NOT suggest vague "soft skills" — be specific (e.g. "Docker" not "problem-solving")`;

    let extracted: Record<string, unknown> = {};

    if (process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0,
      });
      extracted = JSON.parse(res.choices[0].message.content || '{}');
    } else if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      // @ts-ignore
      const raw = res.content[0].text || '{}';
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      extracted = JSON.parse(cleaned);
    } else {
      // No AI — return empty extraction
      return NextResponse.json({
        name: '', email: '', phone: '', linkedin: '', portfolio: '',
        skills: [], suggestedSkills: [],
      });
    }

    return NextResponse.json({
      name:            String(extracted.name            || ''),
      email:           String(extracted.email           || ''),
      phone:           String(extracted.phone           || ''),
      linkedin:        String(extracted.linkedin        || ''),
      portfolio:       String(extracted.portfolio       || ''),
      skills:          Array.isArray(extracted.skills)          ? extracted.skills.slice(0, 20) : [],
      suggestedSkills: Array.isArray(extracted.suggestedSkills) ? extracted.suggestedSkills.slice(0, 8) : [],
    });
  } catch (err: any) {
    console.error('[extract-cv-data]', err);
    return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
  }
}
