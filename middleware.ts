import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

/**
 * Returns true for paths that should never be gated (static assets, landing,
 * future auth API).  Checked before any hostname logic so the matcher config
 * becomes our last line of defence rather than the first.
 */
function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/landing') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  );
}

// ---------------------------------------------------------------------------
// Basic-auth helper
// ---------------------------------------------------------------------------

function requireBasicAuth(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const authValue = authHeader.split(' ')[1] ?? '';
    const [, pwd] = atob(authValue).split(':');

    if (pwd === '2WJFRE12wjfre1') {
      // Credentials valid — allow the request through
      return null;
    }
  }

  // Credentials missing or wrong — issue a Basic-auth challenge
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Resvio"',
    },
  });
}

// ---------------------------------------------------------------------------
// Middleware entry-point
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // 1. Always allow public paths regardless of hostname.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Resolve the effective hostname (strip port for local dev).
  const hostHeader = req.headers.get('host') ?? '';
  const hostname = hostHeader.split(':')[0].toLowerCase();

  // ---------------------------------------------------------------------------
  // Hostname-based routing
  // ---------------------------------------------------------------------------

  // 2a. resvio.online — public marketing / landing domain.
  //     Rewrite every request to /landing so the Next.js page at
  //     app/landing/page.tsx is served without exposing the app.
  if (hostname === 'resvio.online') {
    const url = req.nextUrl.clone();
    url.pathname = '/landing';
    return NextResponse.rewrite(url);
  }

  // 2b. app.resvio.online — routed to the NAS via a Cloudflare Tunnel;
  //     Vercel should never see this hostname in production, but guard anyway.
  if (hostname === 'app.resvio.online') {
    // Treat identically to a normal app request (falls through to auth below).
    // If we ever want to bypass auth here (because the tunnel is already
    // protected) simply return NextResponse.next() instead.
  }

  // 2c. Vercel preview deployments (resvio-*.vercel.app) and localhost.
  //     Both need basic auth to protect the staging environment.
  const isVercelPreview = /^resvio(-[a-z0-9]+)*\.vercel\.app$/.test(hostname);
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isVercelPreview || isLocalhost) {
    const challenge = requireBasicAuth(req);
    if (challenge) return challenge;
    return NextResponse.next();
  }

  // 2d. Any other host — apply basic auth as a safe default.
  const challenge = requireBasicAuth(req);
  if (challenge) return challenge;
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — runs on every route except Next.js internals and static files.
// Public-path logic inside the function body handles the finer exclusions.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static chunks)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
