import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `Extract ALL text from this CV/resume PDF exactly as it appears. 
Preserve the complete content including: name, contact details, work experience (with all dates, company names, job titles, and descriptions), education, skills, languages, certifications, and any other sections.
Do NOT summarize, shorten, or reformat. Output the raw text content preserving structure as much as possible using plain text.`;

    // Try OpenAI first (GPT-4o natively reads PDFs as base64)
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                // @ts-ignore — OpenAI supports file type in content
                type: 'file',
                file: {
                  filename: file.name,
                  file_data: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      const text = response.choices[0].message.content || '';
      return NextResponse.json({ text });
    }

    // Fallback: Anthropic Claude (send as base64 image — convert first page concept)
    // Anthropic supports PDFs as base64 in document type
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as any,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // @ts-ignore
      const text = response.content[0].text || '';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: 'No AI API key configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your environment.' }, { status: 500 });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 });
  }
}
