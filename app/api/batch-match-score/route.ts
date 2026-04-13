import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { Job } from '@/lib/types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const MAX_JOBS = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobs: Job[] = Array.isArray(body.jobs) ? body.jobs.slice(0, MAX_JOBS) : [];

    if (jobs.length === 0) {
      return NextResponse.json({ scores: {} });
    }

    const profile = ProfileService.getProfile();
    const baseCv = profile?.baseCv?.trim();

    if (!baseCv) {
      return NextResponse.json({ scores: {} });
    }

    const jobListText = jobs
      .map(j => `[${j.id}] ${j.title} at ${j.company}\n${(j.description || j.title).slice(0, 300)}`)
      .join('\n\n');

    const prompt = `You are a professional recruiter. Analyze this candidate's CV against multiple job postings.

CANDIDATE CV:
${baseCv}

JOB POSTINGS:
${jobListText}

Return ONLY a JSON object where each key is a job ID and the value is a match percentage (0-100).
Consider: skills match, experience level, industry fit, location relevance.
Example: {"job-id-1": 78, "job-id-2": 45}`;

    let scores: Record<string, number> = {};

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = 'gpt-4o-mini';
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      });
      const raw = response.choices[0].message.content || '{}';
      scores = JSON.parse(raw);
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        system: 'You are a professional recruiter. Always output valid JSON only, no markdown, no explanation.',
        messages: [{ role: 'user', content: prompt }],
      });
      const raw = (response.content[0] as { type: string; text: string }).text || '{}';
      scores = JSON.parse(raw);
    } else {
      // No AI key available — return empty so UI keeps random scores
      return NextResponse.json({ scores: {} });
    }

    // Sanitize: ensure all values are numbers in [0, 100]
    const sanitized: Record<string, number> = {};
    for (const [id, val] of Object.entries(scores)) {
      const n = Number(val);
      if (!isNaN(n)) {
        sanitized[id] = Math.min(100, Math.max(0, Math.round(n)));
      }
    }

    return NextResponse.json({ scores: sanitized });
  } catch (err) {
    console.error('[batch-match-score] error:', err);
    return NextResponse.json({ scores: {} });
  }
}
