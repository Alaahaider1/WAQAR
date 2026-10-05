/**
 * Next.js Middleware.
 *
 * Runs on every matched request before it reaches any page or route handler.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session cookie (required by @supabase/ssr on every request)
 *  2. Protect /admin/* — redirect to /login if not authenticated or not an admin
 *  3. Protect /account/* — redirect to /login if not authenticated
 *  4. Redirect authenticated users away from /login
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/src/types/database';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Build a Supabase client that can read/write cookies on this request
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write outbound cookies onto the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called to refresh the session token.
  // Never use getSession() here — it reads from the cookie without
  // verifying with the Supabase auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── /admin/* protection ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.app_metadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'super_admin') {
      // Authenticated but not an admin — redirect to home
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  }

  // ── /account/* protection ────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Redirect authenticated users away from /login ────────────────────────
  if (pathname === '/login' && user) {
    const role = user.app_metadata?.role as string | undefined;
    const redirectTo =
      request.nextUrl.searchParams.get('redirectTo') ??
      (role === 'admin' || role === 'super_admin' ? '/admin' : '/');

    const dest = request.nextUrl.clone();
    dest.pathname = redirectTo;
    dest.search = '';
    return NextResponse.redirect(dest);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, fonts, etc.)
     * - api routes (handled by route handlers directly)
     */
    // API routes must receive their request streams untouched. In particular,
    // multipart uploads cannot safely pass through the session-refresh proxy.
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
