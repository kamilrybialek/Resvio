import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { ProfileService } from '@/lib/services/profile-service';

export async function POST(req: NextRequest) {
  const { jobUrl, tailoredCvPath, jobId } = await req.json();
  const profile = ProfileService.getProfile();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found. Please setup your profile first.' }, { status: 400 });
  }

  // Mark as applied quickly so the UI can update while the slow browser process runs
  if (jobId) {
    ProfileService.markJobApplied(jobId);
  }

  // We run this locally, so we can use headless: false to let the user see and finish the application
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(jobUrl, { waitUntil: 'networkidle' });

    // Automation logic to find and fill fields
    // This is a generic "Best Effort" approach
    const fieldsToFill = [
      { labels: ['name', 'full name', 'namn', 'förnamn'], value: profile.name },
      { labels: ['email', 'e-post'], value: profile.email },
      { labels: ['phone', 'telefon', 'mobil'], value: profile.phone },
    ];

    for (const field of fieldsToFill) {
      try {
        // Try finding by aria-label or surrounding text
        const selector = field.labels.map(l => `input[aria-label*="${l}" i], input[placeholder*="${l}" i], label:has-text("${l}") + input`).join(', ');
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.fill(field.value);
        }
      } catch (e) {
        console.warn(`Could not fill field: ${field.labels[0]}`);
      }
    }

    // Attachment logic (detecting file inputs)
    try {
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible() && tailoredCvPath) {
        await fileInput.setInputFiles(tailoredCvPath);
      }
    } catch (e) {
      console.warn('Could not find file input for CV');
    }

    // We don't click "Submit" automatically for safety (after all, it's semi-automated)
    return NextResponse.json({ message: 'Browser opened and fields filled. Please review and submit manually.' });
  } catch (error) {
    console.error('Automation Error:', error);
    return NextResponse.json({ error: 'Failed to automate application.' }, { status: 500 });
  }
}

