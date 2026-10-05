/**
 * Authentication service.
 *
 * Wraps Supabase Auth operations with typed errors and consistent return shapes.
 * Called by Server Actions — never called directly from Client Components.
 *
 * All methods are server-side only (use createServerClient).
 */

import { createServerClient } from '@/src/lib/supabase/server';
import {
  AuthError,
  InvalidCredentialsError,
  EmailNotConfirmedError,
  ConflictError,
  ValidationError,
  toWaqarError,
} from '@/src/lib/errors';
import type { AuthUser } from '@/src/types/domain';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapSupabaseAuthError(error: { code?: string; message?: string }): never {
  const code = error.code ?? '';
  const message = error.message ?? 'Authentication error';

  switch (code) {
    case 'invalid_credentials':
    case 'invalid_grant':
      throw new InvalidCredentialsError();
    case 'email_not_confirmed':
      throw new EmailNotConfirmedError();
    case 'user_already_exists':
    case 'email_exists':
      throw new ConflictError('An account with this email address already exists');
    case 'weak_password':
      throw new ValidationError('Password is too weak', {
        password: ['Password must be at least 8 characters and include a number'],
      });
    case 'over_email_send_rate_limit':
      throw new AuthError('Too many emails sent. Please wait before trying again.');
    default:
      throw new AuthError(message);
  }
}

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

export interface SignUpParams {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  session: { accessToken: string; expiresAt: number };
}

/**
 * Create a new customer account.
 * Profile row is created automatically by the DB trigger.
 */
export async function signUp(params: SignUpParams): Promise<{ requiresEmailConfirmation: boolean }> {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName ?? '',
        role: 'customer',
      },
    },
  });

  if (error) mapSupabaseAuthError(error);

  // Supabase requires email confirmation by default
  return { requiresEmailConfirmation: true };
}

/**
 * Sign in with email and password.
 * Returns the authenticated user with their role.
 */
export async function signIn(params: SignInParams): Promise<AuthResponse> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) mapSupabaseAuthError(error);
  if (!data.user || !data.session) throw new AuthError('Sign in failed');

  const role =
    (data.user.app_metadata?.role as AuthUser['role']) ?? 'customer';

  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      role,
      emailConfirmed: !!data.user.email_confirmed_at,
    },
    session: {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at ?? 0,
    },
  };
}

/**
 * Sign out the current user and invalidate their session.
 */
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw toWaqarError(error, 'Sign out');
}

/**
 * Send a password reset email.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXTAUTH_URL}/auth/confirm?type=recovery`,
  });

  if (error) {
    // Don't reveal whether the email exists — return success regardless
    console.error('[auth] Password reset error (not exposed to client):', error);
  }
  // Always return void — don't reveal whether email is registered
}

/**
 * Update the current user's password (called after reset link is clicked).
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) mapSupabaseAuthError(error);
}

/**
 * Refresh the current session. Called by middleware on every request.
 */
export async function refreshSession(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.getSession(); // @supabase/ssr handles refresh automatically
}
