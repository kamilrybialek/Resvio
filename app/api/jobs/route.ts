import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/services/job-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const l = searchParams.get('l') || '';

  if (!q && !l) {
    return NextResponse.json([]);
  }

  try {
    const jobs = await JobService.fetchAllJobs(l, q);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json([]);
  }
}
