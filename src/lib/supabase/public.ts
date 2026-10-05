/** Anonymous Supabase client for shared, RLS-protected public reads. */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import { env } from '@/src/lib/env';

export function createPublicClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
