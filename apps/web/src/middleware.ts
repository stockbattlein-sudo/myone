import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Next.js Edge Middleware — route protection and role-based access.
 *
 * Reads the access_token httpOnly cookie, verifies the JWT signature
 * using jose (Edge Runtime compatible), and enforces role routing:
 *  - /trader/* → requires any authenticated user
 *  - /admin/*  → requires ADMIN role
 *
 * If the access token is expired but a refresh token cookie exists,
 * the middleware lets the request through — the client-side API
 * interceptor will handle the refresh on the next API call.
 */
export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // No access token
  if (!accessToken) {
    if (refreshToken) {
      // Refresh token exists — let the page load; client-side will refresh
      return NextResponse.next();
    }
    // No tokens at all — redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(accessToken, secret);

    // Admin route protection
    if (
      request.nextUrl.pathname.startsWith('/admin') &&
      payload.role !== 'ADMIN'
    ) {
      return NextResponse.redirect(new URL('/trader', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token expired or invalid
    if (refreshToken) {
      // Let client-side handle the refresh
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/trader/:path*', '/admin/:path*'],
};
