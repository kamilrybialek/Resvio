/**
 * GET /api/auth/me
 *
 * Reads the httpOnly session cookie, verifies it with Firebase Admin,
 * and returns the authenticated user's profile from Firestore.
 *
 * Returns 401 when the session is missing or invalid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getUserProfile } from '@/lib/firebase/user-service';

const SESSION_COOKIE_NAME = 'resvio_session';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();

    // Verify the session cookie — checkRevoked: true revokes on password change etc.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const uid = decoded.uid;

    // Fetch profile from Firestore (may be null for brand-new users)
    const profile = await getUserProfile(uid);

    return NextResponse.json({
      uid,
      email:       decoded.email       ?? null,
      displayName: decoded.name        ?? null,
      photoURL:    decoded.picture     ?? null,
      profile:     profile             ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Distinguish between auth errors and unexpected server errors
    const isAuthError =
      message.includes('SESSION_COOKIE_EXPIRED') ||
      message.includes('INVALID_SESSION_COOKIE')  ||
      message.includes('REVOKED_SESSION_COOKIE');

    if (isAuthError) {
      return NextResponse.json({ error: 'Session expired or revoked' }, { status: 401 });
    }

    console.error('[api/auth/me GET] unexpected error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
