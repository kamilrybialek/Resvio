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
    const prompt = `
      You are an expert HR consultant for the Scandinavian market.
      Analyze this job offer and the candidate's base CV.
      
      Job Title: ${job.title}
      Company: ${job.company}
      Description: ${job.description}
      
      Candidate CV:
      ${baseCv}
      
      Return a JSON object with:
      1. "score": Match percentage (0-100).
      2. "reasoning": 2-sentence match explanation.
      3. "tailoringTips": Specific advice for this job.
      4. "tailoredSummary": A rewritten professional summary (3-4 sentences) for this specific application.
    `;

    if (provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.choices[0].message.content || '{}');
    }

    if (provider === 'anthropic' && this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: "You are a job market expert. Always output JSON.",
        messages: [{ role: 'user', content: prompt }]
      });
      // @ts-ignore
      return JSON.parse(response.content[0].text);
    }

    // Fallback/Mock
    return {
      score: 85,
      reasoning: "Strong match for design roles in Sweden.",
      tailoringTips: "Highlight Figma and Nordic design principles.",
      tailoredSummary: "Experienced Graphic Designer with a focus on Scandinavian minimalism..."
    };
  }

  static async generateTailoredCV(job: Job, baseCv: string, provider: AIProvider = 'openai'): Promise<string> {
    // Similar logic to analyzeMatch but focused on full CV rewriting
    return "This is a placeholder for a fully tailored CV in Markdown.";
  }
}
