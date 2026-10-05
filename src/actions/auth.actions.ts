/**
 * Auth server actions.
 *
 * These are the only entry points for authentication from the UI.
 * They validate input, call the auth service, and return typed ActionResult.
 */

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { signUp, signIn, signOut, requestPasswordReset, updatePassword } from '@/src/lib/auth/service';
import { validate, LoginSchema, RegisterSchema, RequestPasswordResetSchema, UpdatePasswordSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError, ValidationError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';

// ---------------------------------------------------------------------------
// Sign Up
// ---------------------------------------------------------------------------

export async function signUpAction(
  rawData: unknown
): Promise<ActionResult<{ requiresEmailConfirmation: boolean }>> {
  try {
    const input = validate(RegisterSchema, rawData);
    const result = await signUp({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
    });
    return actionSuccess(result);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Sign up failed. Please try again.', 'UNKNOWN_ERROR'));
  }
}

// ---------------------------------------------------------------------------
// Sign In
// ---------------------------------------------------------------------------

export async function signInAction(
  rawData: unknown
): Promise<ActionResult<{ role: string }>> {
  try {
    const input = validate(LoginSchema, rawData);
    const result = await signIn({ email: input.email, password: input.password });
    revalidatePath('/', 'layout');
    return actionSuccess({ role: result.user.role });
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Sign in failed. Please try again.', 'UNKNOWN_ERROR'));
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Request Password Reset
// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(
  rawData: unknown
): Promise<ActionResult<void>> {
  try {
    const input = validate(RequestPasswordResetSchema, rawData);
    await requestPasswordReset(input.email);
    // Always return success — never reveal if email exists
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Request failed. Please try again.', 'UNKNOWN_ERROR'));
  }
}

// ---------------------------------------------------------------------------
// Update Password (after reset link click)
// ---------------------------------------------------------------------------

export async function updatePasswordAction(
  rawData: unknown
): Promise<ActionResult<void>> {
  try {
    const input = validate(UpdatePasswordSchema, rawData);
    await updatePassword(input.newPassword);
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Password update failed. Please try again.', 'UNKNOWN_ERROR'));
  }
}
