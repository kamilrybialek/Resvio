import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // @ts-ignore
    const reqInstance = typeof window === 'undefined' ? eval('require') : null;
    if (!reqInstance) throw new Error("Backend only limit");
    const pdfParse = reqInstance('pdf-parse');
    
    const data = await pdfParse(buffer);

    
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
