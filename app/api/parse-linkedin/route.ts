import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-extra';
// @ts-ignore
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(stealthPlugin());

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  
  if (!url || !url.includes('linkedin.com/in/')) {
    return NextResponse.json({ error: 'Valid LinkedIn profile URL required' }, { status: 400 });
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    
    // NOTE: LinkedIn heavily blocks public profile scraping. 
    // We try to extract whatever text is visible. If there is an authwall, the scraped text will be mostly "Sign in".
    // This is a "best effort" scrape.
    const profileText = await page.evaluate(() => {
      // Remove scripts and styles
      document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      return document.body.innerText.replace(/\n\s*\n/g, '\n').substring(0, 5000); // Take first 5000 chars to avoid massive payloads
    });

    if (profileText.includes('Sign in to view') || profileText.includes('Join LinkedIn')) {
      // Graceful fallback if we hit the auth wall
      return NextResponse.json({ 
        text: "Could not fully scrape LinkedIn due to an Auth Wall.\n\nPlease manually paste your CV data or try importing from PDF instead.",
        status: "partial"
      });
    }

    return NextResponse.json({ text: profileText });
  } catch (error) {
    console.error('LinkedIn Parse Error:', error);
    return NextResponse.json({ error: 'Failed to access LinkedIn profile' }, { status: 500 });
  } finally {
    await browser.close();
  }
}
