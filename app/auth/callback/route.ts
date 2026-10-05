/**
 * GET /auth/callback
 *
 * Handles the redirect after:
 *   - Email confirmation (sign up)
 *   - Password reset link
 *   - Magic link sign in
 *
 * Supabase appends ?code=... to this URL. We exchange it for a session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery' | 'signup' | 'magiclink'
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect based on flow type
      if (type === 'recovery') {
        // Password reset — send to update-password page
        return NextResponse.redirect(`${origin}/account/update-password`);
      }
      // Default: go to the intended destination
      const destination = new URL(next, origin);
      if (destination.origin !== origin) destination.pathname = '/';
      return NextResponse.redirect(destination);
    }

    console.error('[auth/callback] Code exchange failed:', error.message);
  }

  // Exchange failed or no code — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
