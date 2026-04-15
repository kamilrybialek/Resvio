import { NextRequest, NextResponse } from 'next/server';
import { TrackerService, TrackerStatus } from '@/lib/services/tracker-service';

export async function GET() {
  return NextResponse.json(TrackerService.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'upsert') {
    const entry = TrackerService.upsert(body.entry);
    return NextResponse.json(entry);
  }

  if (body.action === 'status' && body.id && body.status) {
    TrackerService.updateStatus(body.id, body.status as TrackerStatus);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'notes' && body.id !== undefined) {
    TrackerService.updateNotes(body.id, body.notes || '');
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'delete' && body.id) {
    TrackerService.delete(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
