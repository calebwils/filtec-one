import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'filtec_session';

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET environment variable is missing in production. Refusing to operate with fallback secret.'
      );
    }
    return 'filtec_local_dev_ephemeral_auth_secret_do_not_use_in_prod_x92!';
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET must be at least 32 characters in production.'
    );
  }
  return secret;
}

interface TokenData {
  userId: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'DEALER';
  name?: string;
  exp?: number;
}

async function verifyEdgeToken(token: string): Promise<TokenData | null> {
  try {
    if (!token || !token.includes('.')) return null;
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getAuthSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(encodedPayload));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signature !== expectedSig) return null;

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr) as TokenData;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected portal boundaries
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/dashboard';
  const isEmployeeRoute = pathname.startsWith('/employee');
  const isDealerRoute = pathname.startsWith('/dealer');

  if (!isAdminRoute && !isEmployeeRoute && !isDealerRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyEdgeToken(token) : null;

  if (!user) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isAdminRoute && user.role !== 'ADMIN') {
    const target = user.role === 'EMPLOYEE' ? '/employee' : '/dealer';
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isEmployeeRoute && user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dealer', request.url));
  }

  if (isDealerRoute && user.role !== 'DEALER') {
    const target = user.role === 'ADMIN' ? '/admin' : '/employee';
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/employee/:path*',
    '/dealer/:path*'
  ],
};
