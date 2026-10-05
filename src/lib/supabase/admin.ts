/**
 * Admin (service role) Supabase client.
 *
 * Use in: Server Actions and Route Handlers that perform privileged operations.
 * NEVER import in client components — the service role key bypasses ALL RLS.
 *
 * This client should be used only for:
 *   - Order placement (writing order + items + inventory atomically)
 *   - Admin CRUD operations after authorization has been verified in the action
 *   - Background jobs / webhooks
 *
 * Security note:
 *   Authorization must be verified BEFORE calling this client.
 *   Use requireAdmin() from src/lib/auth/guards.ts first.
 *
 * @example
 *   import { createAdminClient } from '@/src/lib/supabase/admin'
 *   const supabase = createAdminClient()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import { env } from '@/src/lib/env';

let adminClientInstance: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  if (adminClientInstance) return adminClientInstance;

  adminClientInstance = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Disable auto session refresh — this is a server-only client
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  return adminClientInstance;
}
