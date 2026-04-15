import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/services/job-service';
import { MarketId } from '@/lib/markets';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const l = searchParams.get('l') || '';
  const p = parseInt(searchParams.get('p') || '1');
  const d = searchParams.get('d') || 'any';
  const m = (searchParams.get('m') || 'scandinavia') as MarketId;

  if (!q && !l) {
    return NextResponse.json([]);
  }

  try {
    const jobs = await JobService.fetchAllJobs(l, q, p, d, m);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json([]);
  }
}
