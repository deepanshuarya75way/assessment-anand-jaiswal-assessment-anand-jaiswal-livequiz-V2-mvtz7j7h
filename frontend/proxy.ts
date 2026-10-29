import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Retrieve the access token from cookies
  const accessToken = request.cookies.get('ll_access_token')?.value;

  // 1. Protected paths: Require authentication
  const isDashboardPath = pathname.startsWith('/dashboard');
  
  if (isDashboardPath && !accessToken) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 2. Auth paths: Restrict if already logged in
  const isAuthPath = pathname === '/auth/login' || pathname === '/auth/signup';
  
  if (isAuthPath && accessToken) {
    // Redirect to dashboard page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
