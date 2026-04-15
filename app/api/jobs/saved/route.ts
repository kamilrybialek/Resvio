/**
 * /api/jobs/saved — Saved jobs for the authenticated user.
 *
 * GET  → return all saved jobs from Firestore for the authenticated user.
 * POST → save or unsave a single job.
 *
 * POST body:
 *   { action: 'save',   job: Job  }  — upsert the job document
 *   { action: 'unsave', jobId: string } — remove the job document
 *
 * Graceful degradation:
 *   When Firebase is not configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID unset)
 *   the endpoint returns empty arrays / success stubs so callers don't break.
 *
 * Security:
 *   uid is always from the verified Firebase token — never client-supplied.
 *   jobId is validated to alphanumeric + dashes before any Firestore operation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth }          from '@/lib/firebase/auth-middleware';
import { getSavedJobs, saveJob, removeJob } from '@/lib/firebase/user-service';
import { validateJobId, sanitizeInput } from '@/lib/firebase/security';
import type { Job }          from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

/**
 * Minimal structural check that the incoming object looks like a Job.
 * Full schema validation could use zod; this is a lightweight guard.
 */
function isValidJob(obj: unknown): obj is Job {
  if (typeof obj !== 'object' || obj === null) return false;
  const j = obj as Record<string, unknown>;
  return (
    typeof j.id          === 'string' && validateJobId(j.id) &&
    typeof j.title       === 'string' &&
    typeof j.company     === 'string' &&
    typeof j.location    === 'string' &&
    typeof j.description === 'string' &&
    typeof j.url         === 'string' &&
    typeof j.postedAt    === 'string' &&
    typeof j.source      === 'string'
  );
}

/**
 * Strip fields that should not be persisted client-side (e.g. huge descriptions).
 * Caps string fields to reasonable lengths.
 */
function sanitizeJob(job: Job): Job {
  return {
    ...job,
    id:          sanitizeInput(job.id,          128),
    title:       sanitizeInput(job.title,        256),
    company:     sanitizeInput(job.company,      256),
    location:    sanitizeInput(job.location,     256),
    description: sanitizeInput(job.description, 8192),
    url:         sanitizeInput(job.url,          512),
    salary:      job.salary ? sanitizeInput(job.salary, 128) : undefined,
    tags:        job.tags?.map(t => sanitizeInput(t, 64)),
  };
}

// ─────────────────────────────────────────────────────────────
// GET — list saved jobs
// ─────────────────────────────────────────────────────────────

export const GET = withAuth(async (_req, { uid }) => {
  if (!isFirebaseConfigured()) {
    // Single-user mode: no persistent saved-jobs store exists yet
    return NextResponse.json({ jobs: [] });
  }

  try {
    const jobs = await getSavedJobs(uid);
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error('[jobs/saved GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch saved jobs.' }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────
// POST — save or unsave a job
// ─────────────────────────────────────────────────────────────

export const POST = withAuth(async (req: NextRequest, { uid }) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { action } = body;

  // ── save ─────────────────────────────────────────────────
  if (action === 'save') {
    if (!isValidJob(body.job)) {
      return NextResponse.json({ error: 'Invalid or missing job payload.' }, { status: 400 });
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json({ message: 'Job saved (stub — Firebase not configured).' });
    }

    try {
      await saveJob(uid, sanitizeJob(body.job as Job));
      return NextResponse.json({ message: 'Job saved.' });
    } catch (err) {
      console.error('[jobs/saved POST save] Unexpected error:', err);
      return NextResponse.json({ error: 'Failed to save job.' }, { status: 500 });
    }
  }

  // ── unsave ───────────────────────────────────────────────
  if (action === 'unsave') {
    const jobId = body.jobId;

    if (typeof jobId !== 'string' || !validateJobId(jobId)) {
      return NextResponse.json({ error: 'Invalid or missing jobId.' }, { status: 400 });
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json({ message: 'Job removed (stub — Firebase not configured).' });
    }

    try {
      await removeJob(uid, jobId);
      return NextResponse.json({ message: 'Job removed.' });
    } catch (err) {
      console.error('[jobs/saved POST unsave] Unexpected error:', err);
      return NextResponse.json({ error: 'Failed to remove job.' }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: 'Unknown action. Expected "save" or "unsave".' },
    { status: 400 },
  );
});
