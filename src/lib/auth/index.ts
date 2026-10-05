/**
 * Auth module exports.
 *
 * @example
 *   import { requireAdmin, getCurrentUser } from '@/src/lib/auth'
 *   import { signIn, signOut } from '@/src/lib/auth'
 */

export {
  signUp,
  signIn,
  signOut,
  requestPasswordReset,
  updatePassword,
  refreshSession,
} from './service';

export type { SignUpParams, SignInParams, AuthResponse } from './service';

export {
  getCurrentUser,
  getCurrentProfile,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireOwnerOrAdmin,
  requireProfile,
} from './guards';
