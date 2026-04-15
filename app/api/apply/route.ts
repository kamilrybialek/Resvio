import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/lib/services/profile-service';
import { TrackerService } from '@/lib/services/tracker-service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobUrl, tailoredCvPath, jobId, toggle, currentlyApplied } = body;
  const profile = ProfileService.getProfile();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found. Please setup your profile first.' }, { status: 400 });
  }

  // Toggle mode: just mark/unmark and return
  if (toggle && jobId) {
    const newState = ProfileService.toggleJobApplied(jobId);
    // Add to tracker when marking as applied
    if (newState && body.jobTitle) {
      TrackerService.upsert({
        jobId,
        jobTitle: body.jobTitle || jobId,
        company: body.company || '',
        location: body.location || '',
        source: body.source || '',
        url: body.jobUrl || '',
      });
    }
    return NextResponse.json({ applied: newState });
  }

  // Standard apply: mark as applied
  if (jobId) {
    ProfileService.markJobApplied(jobId);
  }

  if (process.env.VERCEL === '1') {
    return NextResponse.json({ 
      action: 'redirect',
      url: jobUrl,
      message: "Moved to job posting. Automatic form filling is disabled on the Vercel cloud environment." 
    });
  }

  // @ts-ignore
  const reqInstance = typeof window === 'undefined' ? eval('require') : null;
  const playwright = reqInstance('playwright');

  // We run this locally, so we can use headless: false to let the user see and finish the application
  const browser = await playwright.chromium.launch({ headless: false });
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

