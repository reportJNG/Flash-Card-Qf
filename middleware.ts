import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getSessionSecret } from '@/lib/env';

const SECRET = new TextEncoder().encode(getSessionSecret());
const COOKIE_NAME = 'flashqf_session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/categories') ||
    request.nextUrl.pathname.startsWith('/play') ||
    request.nextUrl.pathname.startsWith('/planning') ||
    request.nextUrl.pathname.startsWith('/stats') ||
    request.nextUrl.pathname.startsWith('/leaderboard') ||
    request.nextUrl.pathname.startsWith('/settings');

  if (isDashboardRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      await jwtVerify(token, SECRET, { clockTolerance: 60 });
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/categories/:path*', '/play/:path*', '/planning', '/stats', '/leaderboard', '/settings'],
};
