import { Job } from '../types';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AnalysisResult {
  score: number;
  reasoning: string;
  tailoringTips: string;
  tailoredSummary: string;
}

export class AIService {
  private static openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  private static anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

  static async analyzeMatch(
    job: Job,
    baseCv: string,
    provider: AIProvider = 'openai'
  ): Promise<AnalysisResult> {
    // Truncate inputs to control token usage
    const cvExcerpt = baseCv.slice(0, 3000);
    const jobDesc = (job.description || '').slice(0, 1000);

    const systemPrompt = 'You are a Scandinavian job market recruiter. Analyze CV-job fit. Output ONLY valid JSON, no markdown fences.';

    const userPrompt = `Rate this candidate for the job. Return JSON with exactly these keys:
- "score": integer 0-100 (skills match, seniority fit, domain relevance)
- "reasoning": 1-2 sentences on why the score is what it is
- "tailoringTips": 1 concrete action to strengthen this application

JOB: ${job.title} at ${job.company}${job.location ? ` (${job.location})` : ''}
${jobDesc}

CANDIDATE CV:
${cvExcerpt}`;

    if (provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 350,
        temperature: 0,
      });
      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return { score: 75, reasoning: '', tailoringTips: '', tailoredSummary: '', ...parsed };
    }

    if (provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const parsed = JSON.parse((response.content[0] as { type: string; text: string }).text || '{}');
      return { score: 75, reasoning: '', tailoringTips: '', tailoredSummary: '', ...parsed };
    }

    return {
      score: 75,
      reasoning: 'AI analysis unavailable — no API key configured.',
      tailoringTips: 'Add your OpenAI or Anthropic API key in .env.local.',
      tailoredSummary: '',
    };
  }
}
