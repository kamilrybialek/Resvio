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

    // Use CV excerpt (skills + recent experience) — full CV wastes tokens in batch mode
    const cvExcerpt = baseCv.slice(0, 2500);

    const jobListText = jobs
      .map(j => `[${j.id}] ${j.title} @ ${j.company}${j.location ? ` (${j.location})` : ''}: ${(j.description || j.title).slice(0, 250)}`)
      .join('\n');

    const systemPrompt = 'You are a recruiter. Score CV-job matches. Output ONLY valid JSON, no markdown.';
    const userPrompt = `Score each job for this candidate (0-100). Criteria: skills match, seniority fit, industry relevance, location fit.

CANDIDATE:
${cvExcerpt}

JOBS:
${jobListText}

Return JSON: {"job-id": score, ...}`;

    let scores: Record<string, number> = {};

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 400,
        temperature: 0,
      });
      const raw = response.choices[0].message.content || '{}';
      scores = JSON.parse(raw);
    } else if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
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
