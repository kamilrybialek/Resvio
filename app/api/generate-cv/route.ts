import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';
import { ProfileService } from '@/lib/services/profile-service';
import { Job } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { job, manualDescription }: { job: Job; manualDescription?: string } = await req.json();

    if (!job) {
      return NextResponse.json({ error: 'Job data required' }, { status: 400 });
    }

    const profile = ProfileService.getProfile();
    const baseCv = profile?.baseCv || profile?.baseCvPath || '';

    if (!baseCv || baseCv.length < 30) {
      return NextResponse.json({
        error: 'Please add your base CV first in the Profile page before generating a tailored CV.',
      }, { status: 400 });
    }

    const jobDescription = manualDescription || job.description || 'No description provided.';
    const provider: 'openai' | 'anthropic' = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';

    const prompt = `You are an expert CV writer for the European job market with deep knowledge of ATS (Applicant Tracking Systems) and GDPR requirements.

Generate a perfectly tailored, ATS-optimized CV based on the candidate's base CV and the job offer below.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${jobDescription}

CANDIDATE BASE CV:
${baseCv}

OUTPUT RULES (follow exactly):
1. Output ONLY the CV in the structured Markdown format below — no preamble, no comments.
2. Keep ALL real facts, dates, and experiences from the base CV — never invent anything.
3. Reorder and emphasize skills/experiences most relevant to this specific job.
4. Write a strong 3-4 sentence professional summary matching the job requirements.
5. Use clean bullet points (- ) for achievements — start with power verbs.
6. Include a GDPR consent clause at the very end.
7. ATS optimization: use common keywords from the job description, avoid tables/columns/special chars.

REQUIRED OUTPUT FORMAT:
# [FULL NAME]
## [Professional Title matching the job]

CONTACT: [Email] | [Phone] | [Location] | [Portfolio/LinkedIn if available]

## PROFESSIONAL SUMMARY
[3-4 tailored sentences]

## PROFESSIONAL EXPERIENCE

### [Job Title] | [Company] | [Start Year] – [End Year or Present]
[City, Country]
- [Achievement with metric if possible]
- [Achievement]
- [Responsibility]

[Repeat for each role]

## EDUCATION

### [Degree] | [Institution] | [Year]
[Details if relevant]

## SKILLS & COMPETENCIES
[Skill1], [Skill2], [Skill3], [Skill4], [Skill5], ...

## LANGUAGES
[Language]: [Level], [Language]: [Level]

## ADDITIONAL INFORMATION
[Certifications, interests, or awards if relevant — keep brief]

---
*I hereby consent to the processing of my personal data included in this application for the purposes of the recruitment process, in accordance with Regulation (EU) 2016/679 (GDPR).*`;

    let tailoredCv = '';
    
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      });
      tailoredCv = response.choices[0].message.content || '';
    } else if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
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
