import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Hardcoded password requested by the user
    if (pwd === '2WJFRE12wjfre1') {
      return NextResponse.next();
    }
  }

  // Request basic auth
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Applyarr Secure Area"',
    },
  });
}

export const config = {
  // Protect all routes except static assets
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
