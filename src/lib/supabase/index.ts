/**
 * Supabase client exports.
 *
 * Always import from here, not from the individual files.
 *
 * @example
 *   // In a Server Component or Server Action:
 *   import { createServerClient } from '@/src/lib/supabase'
 *
 *   // In a Client Component:
 *   import { createBrowserClient } from '@/src/lib/supabase'
 *
 *   // In a privileged Server Action (after authorization check):
 *   import { createAdminClient } from '@/src/lib/supabase'
 */

export { createBrowserClient } from './client';
export { createServerClient } from './server';
export { createAdminClient } from './admin';
