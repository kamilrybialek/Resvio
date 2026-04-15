/**
 * withAuth — Firebase Auth middleware for Next.js App Router API routes.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { uid, email }) => {
 *     // uid and email come from the verified Firebase session token
 *     return NextResponse.json({ uid });
 *   });
 *
 * Token flow:
 *   1. Client sets a 'session' cookie containing a Firebase ID token (or
 *      session cookie created via Admin SDK createSessionCookie).
 *   2. This middleware reads that cookie and verifies it with the Admin SDK.
 *   3. On success the verified uid + email are injected into the handler.
 *   4. On failure a 401 JSON response is returned.
 *
 * Single-user fallback:
 *   When NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set the middleware skips
 *   token verification and injects uid='local' + email='local@localhost'.
 *   This preserves existing single-user behaviour during local development
 *   and for deployments that have not yet set up Firebase.
 *
 * Security note:
 *   The uid is ALWAYS sourced from the verified token — never from request
 *   body / query parameters / client-supplied headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from './admin';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AuthContext {
  uid:   string;
  email: string;
}

export type AuthedHandler = (
  req: NextRequest,
  ctx: AuthContext,
) => Promise<Response>;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

function unauthorizedResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Extract the raw token string from the 'session' cookie.
 * Returns null when the cookie is absent or empty.
 */
function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get('session');
  const token  = cookie?.value?.trim();
  return token ? token : null;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Higher-order function that wraps a Next.js App Router route handler with
 * Firebase Auth verification.
 *
 * @param handler  The actual route logic that receives (req, AuthContext).
 * @returns        A plain (req: NextRequest) => Promise<Response> suitable
 *                 for export as GET / POST / etc. in a route.ts file.
 */
export function withAuth(handler: AuthedHandler): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest): Promise<Response> => {
    // ── Single-user fallback ────────────────────────────────
    if (!isFirebaseConfigured()) {
      return handler(req, { uid: 'local', email: 'local@localhost' });
    }

    // ── Extract token ───────────────────────────────────────
    const token = extractToken(req);
    if (!token) {
      return unauthorizedResponse('Missing session cookie.');
    }

    // ── Verify token with Firebase Admin ────────────────────
    try {
      const adminAuth = getAdminAuth();

      // verifyIdToken accepts both ID tokens and session cookies.
      // For session cookies created via Admin SDK use verifySessionCookie instead.
      const decoded = await adminAuth.verifyIdToken(token, /* checkRevoked */ true);

      const ctx: AuthContext = {
        uid:   decoded.uid,
        email: decoded.email ?? '',
      };

      return handler(req, ctx);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Token verification failed.';

      console.warn('[auth-middleware] Token verification failed:', message);

      // Distinguish between a revoked/expired token and an unexpected error
      const isAuthError =
        message.includes('Firebase ID token') ||
        message.includes('auth/') ||
        message.includes('expired') ||
        message.includes('revoked');

      if (isAuthError) {
        return unauthorizedResponse('Invalid or expired session. Please sign in again.');
      }

      // Unexpected server error (e.g. Admin SDK not initialised)
      return NextResponse.json(
        { error: 'Authentication service unavailable.' },
        { status: 503 },
      );
    }
  };
}
