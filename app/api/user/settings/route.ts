/**
 * /api/user/settings — User preferences (market, theme).
 *
 * GET  → return the authenticated user's settings from Firestore.
 * POST → update (merge) the authenticated user's settings in Firestore.
 *
 * POST body (all fields optional):
 *   { market?: MarketId; theme?: 'light' | 'dark' | 'system' }
 *
 * Graceful degradation:
 *   When Firebase is not configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID unset)
 *   the endpoint returns default settings on GET and succeeds silently on POST.
 *
 * Security:
 *   uid is always from the verified Firebase token — never client-supplied.
 *   market is validated against the known MarketId values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth }                  from '@/lib/firebase/auth-middleware';
import { getUserSettings, saveUserSettings } from '@/lib/firebase/user-service';
import type { Settings }             from '@/lib/firebase/user-service';
import { validateMarketId }          from '@/lib/firebase/security';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const VALID_THEMES = new Set<string>(['light', 'dark', 'system']);

const DEFAULT_SETTINGS: Settings = {
  market: 'scandinavia',
  theme:  'system',
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

/**
 * Validate and extract only the allowlisted settings fields from a raw body.
 * Returns null if the body contains no recognisable settings fields.
 */
function parseSettingsBody(body: Record<string, unknown>): Partial<Settings> | null {
  const partial: Partial<Settings> = {};

  if (body.market !== undefined) {
    if (typeof body.market !== 'string' || !validateMarketId(body.market)) {
      return null; // signal a bad-request
    }
    partial.market = body.market;
  }

  if (body.theme !== undefined) {
    if (typeof body.theme !== 'string' || !VALID_THEMES.has(body.theme)) {
      return null;
    }
    partial.theme = body.theme as Settings['theme'];
  }

  return Object.keys(partial).length > 0 ? partial : {};
}

// ─────────────────────────────────────────────────────────────
// GET — retrieve settings
// ─────────────────────────────────────────────────────────────

export const GET = withAuth(async (_req, { uid }) => {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  try {
    const settings = await getUserSettings(uid);
    return NextResponse.json(settings);
  } catch (err) {
    console.error('[user/settings GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────────────
// POST — update settings
// ─────────────────────────────────────────────────────────────

export const POST = withAuth(async (req: NextRequest, { uid }) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseSettingsBody(body);

  if (parsed === null) {
    return NextResponse.json(
      { error: 'Invalid settings value. Check "market" and "theme" fields.' },
      { status: 400 },
    );
  }

  if (Object.keys(parsed).length === 0) {
    return NextResponse.json(
      { error: 'No recognisable settings fields provided.' },
      { status: 400 },
    );
  }

  if (!isFirebaseConfigured()) {
    // Single-user / local mode — acknowledge without persisting
    return NextResponse.json({ message: 'Settings updated (stub — Firebase not configured).' });
  }

  try {
    await saveUserSettings(uid, parsed);
    return NextResponse.json({ message: 'Settings updated.' });
  } catch (err) {
    console.error('[user/settings POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
});
