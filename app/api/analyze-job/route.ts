import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { ProfileService } from '@/lib/services/profile-service';

export async function POST(req: NextRequest) {
  try {
    const { job } = await req.json();
    
    if (!job) {
      return NextResponse.json({ error: 'Job data required' }, { status: 400 });
    }

    const profile = ProfileService.getProfile();
    const baseCv = profile?.baseCv || "No CV provided.";

    // Choose Provider (we fallback to OpenAI by default if key exists, else Anthropic, etc.)
    let provider: 'openai' | 'anthropic' | 'gemini' = 'openai';
    if (!process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY) {
      provider = 'anthropic';
    }

    const analysis = await AIService.analyzeMatch(job, baseCv, provider);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to analyze job match' }, { status: 500 });
  }
}
