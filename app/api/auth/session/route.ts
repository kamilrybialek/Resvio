/**
 * /api/auth/session
 *
 * POST  — verify a Firebase ID token → set an httpOnly session cookie (7 days)
 * DELETE — clear the session cookie (logout)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

const SESSION_COOKIE_NAME = 'resvio_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken: string | undefined = body?.idToken;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Create a short-lived session cookie from the ID token.
    // Firebase session cookies work with verifySessionCookie on subsequent requests.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Decode the token to return basic user info to the client.
    const decoded = await adminAuth.verifyIdToken(idToken);

    const response = NextResponse.json({
      uid:         decoded.uid,
      email:       decoded.email ?? null,
      displayName: decoded.name  ?? null,
      photoURL:    decoded.picture ?? null,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   SESSION_DURATION_MS / 1000, // seconds
      path:     '/',
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/auth/session POST] error:', message);
    return NextResponse.json({ error: 'Failed to create session', detail: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' });

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   0,
    path:     '/',
  });

  return response;
}
