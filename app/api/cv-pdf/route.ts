import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Playwright is disabled on Vercel
  if (process.env.VERCEL === '1') {
    return NextResponse.json({ action: 'print' }, { status: 200 });
  }

  try {
    const { html, filename = 'cv.pdf' } = await req.json();
    if (!html) return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });

    // Build a complete HTML document with the CV styles
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { width: 210mm; background: white; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
${html}
</body>
</html>`;

    // @ts-ignore
    const reqInstance = typeof window === 'undefined' ? eval('require') : null;
    const playwright = reqInstance('playwright');

    const browser = await playwright.chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    // Return fallback signal — client will use window.print()
    return NextResponse.json({ action: 'print', error: err.message }, { status: 200 });
  }
}
