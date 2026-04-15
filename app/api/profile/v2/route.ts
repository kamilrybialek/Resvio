/**
 * /api/profile/v2 — Multi-user profile endpoint (Firebase-backed).
 *
 * GET  → return the authenticated user's profile from Firestore.
 * POST → save (merge) the authenticated user's profile to Firestore.
 *
 * Graceful degradation:
 *   When Firebase is NOT configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID unset)
 *   the handler falls back to the existing profile.json behaviour so local
 *   development and single-user deployments are unaffected.
 *
 * Security:
 *   The uid is always sourced from the verified Firebase token via withAuth —
 *   never from the request body or query parameters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth }           from '@/lib/firebase/auth-middleware';
import { getUserProfile, saveUserProfile } from '@/lib/firebase/user-service';
import { ProfileService }     from '@/lib/services/profile-service';
import { sanitizeInput }      from '@/lib/firebase/security';
import type { UserProfile }   from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAX_FIELD_LENGTH = 4096; // generous cap for baseCv markdown

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

/**
 * Lightly sanitise incoming profile data.
 * We only sanitise string scalar fields — arrays of strings are
 * sanitised element-by-element.
 */
function sanitizeProfile(raw: Record<string, unknown>): Partial<UserProfile> {
  const safe: Partial<UserProfile> = {};

  if (typeof raw.name  === 'string') safe.name  = sanitizeInput(raw.name,  256);
  if (typeof raw.email === 'string') safe.email = sanitizeInput(raw.email, 256);
  if (typeof raw.phone === 'string') safe.phone = sanitizeInput(raw.phone, 64);

  if (typeof raw.baseCvPath === 'string')
    safe.baseCvPath = sanitizeInput(raw.baseCvPath, 512);

  if (typeof raw.baseCv === 'string')
    safe.baseCv = sanitizeInput(raw.baseCv, MAX_FIELD_LENGTH);

  if (typeof raw.portfolioUrl === 'string')
    safe.portfolioUrl = sanitizeInput(raw.portfolioUrl, 512);

  if (Array.isArray(raw.skills))
    safe.skills = (raw.skills as unknown[])
      .filter((s): s is string => typeof s === 'string')
      .map(s => sanitizeInput(s, 128));

  if (Array.isArray(raw.appliedJobs))
    safe.appliedJobs = (raw.appliedJobs as unknown[])
      .filter((id): id is string => typeof id === 'string')
      .map(id => sanitizeInput(id, 128));

  return safe;
}

// ─────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────

export const GET = withAuth(async (_req, { uid }) => {
  // ── Single-user fallback ──────────────────────────────────
  if (!isFirebaseConfigured()) {
    const profile = ProfileService.getProfile();
    return NextResponse.json(profile ?? {});
  }

  // ── Firebase path ─────────────────────────────────────────
  try {
    const profile = await getUserProfile(uid);
    return NextResponse.json(profile ?? {});
  } catch (err) {
    console.error('[profile/v2 GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, { uid }) => {
  // ── Parse body ────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const sanitized = sanitizeProfile(body);

  // ── Single-user fallback ──────────────────────────────────
  if (!isFirebaseConfigured()) {
    const existing = ProfileService.getProfile() ?? {
      name: '', email: '', phone: '', skills: [], baseCvPath: '',
    };

    const updated: UserProfile = {
      ...existing,
      ...sanitized,
      // Keep the legacy mapping: baseCv (UI field) → baseCvPath
      baseCvPath: (sanitized.baseCv ?? sanitized.baseCvPath ?? existing.baseCvPath) as string,
      baseCv:     (sanitized.baseCv ?? existing.baseCv) as string | undefined,
    };

    ProfileService.saveProfile(updated);
    return NextResponse.json({ message: 'Profile saved.' });
  }

  // ── Firebase path ─────────────────────────────────────────
  try {
    // Align baseCv / baseCvPath the same way as the legacy route
    if (sanitized.baseCv && !sanitized.baseCvPath) {
      sanitized.baseCvPath = sanitized.baseCv;
    }

    await saveUserProfile(uid, sanitized);
    return NextResponse.json({ message: 'Profile saved.' });
  } catch (err) {
    console.error('[profile/v2 POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }
});
