/**
 * Authorization guards.
 *
 * Use these at the top of every Server Action and protected Route Handler.
 * They throw typed errors that Server Actions convert to ActionResult.
 *
 * @example
 *   // In a Server Action:
 *   export async function updateProduct(id: string, data: unknown) {
 *     const user = await requireAdmin()   // throws ForbiddenError if not admin
 *     // ... proceed with authorized operation
 *   }
 */

import { createServerClient } from '@/src/lib/supabase/server';
import { AuthError, ForbiddenError, NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { AuthUser, Profile } from '@/src/types/domain';

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated Supabase user, or null if not signed in.
 * Does NOT throw — use requireAuth() if the caller requires authentication.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const role =
      (user.app_metadata?.role as AuthUser['role']) ?? 'customer';

    return {
      id: user.id,
      email: user.email!,
      role,
      emailConfirmed: !!user.email_confirmed_at,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current user's profile row from public.profiles, or null.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role as Profile['role'],
      isActive: profile.is_active,
      createdAt: profile.created_at,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Guards — throw on failure
// ---------------------------------------------------------------------------

/**
 * Requires the caller to be authenticated.
 * Throws AuthError (401) if not signed in.
 * Returns the authenticated user.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

/**
 * Requires the caller to have admin or super_admin role.
 * Throws AuthError (401) if not signed in.
 * Throws ForbiddenError (403) if signed in but not an admin.
 * Returns the authenticated admin user.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new ForbiddenError();
  }
  return user;
}

/**
 * Requires the caller to have super_admin role specifically.
 * Throws ForbiddenError (403) for regular admins.
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'super_admin') {
    throw new ForbiddenError('This action requires super admin privileges');
  }
  return user;
}

/**
 * Requires the caller to own the resource (user_id matches) OR be an admin.
 * Throws ForbiddenError if neither condition is met.
 */
export async function requireOwnerOrAdmin(resourceUserId: string): Promise<AuthUser> {
  const user = await requireAuth();
  const isOwner = user.id === resourceUserId;
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError();
  }
  return user;
}

/**
 * Fetches the current user's profile and asserts it exists.
 * Throws NotFoundError if profile row is missing (shouldn't happen with the trigger).
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new NotFoundError('User profile');
  }
  return profile;
}
