import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Computes a SHA-256 hex hash using the Web Crypto API (Edge Runtime compatible).
 */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase keys are not set, allow request through in development
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('mock-supabase')) {
    // Still check admin routes even without Supabase
    const adminCheck = await checkAdminAccess(request);
    if (adminCheck) return adminCheck;
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard');

  // Redirect unauthenticated users trying to access user dashboard pages to login
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from login/signup to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin route protection (after auth check)
  const adminCheck = await checkAdminAccess(request);
  if (adminCheck) return adminCheck;

  return response;
}

/**
 * Checks if the request is for an admin sub-route (e.g., /admin/blog)
 * and validates the admin token cookie. The gate page itself (/admin exact) is exempt.
 */
async function checkAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Only protect admin sub-routes, not the gate page itself
  if (!pathname.startsWith('/admin/')) return null;

  const adminSecret = process.env.ADMIN_SECRET?.trim();
  if (!adminSecret) {
    // No admin secret configured — allow through (dev fallback)
    return null;
  }

  const expectedToken = await sha256Hex(`foliocraft_admin_${adminSecret}_salt_v1`);
  const cookieToken = request.cookies.get('foliocraft_admin_token')?.value;

  if (!cookieToken || cookieToken !== expectedToken) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
