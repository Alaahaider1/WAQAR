/**
 * Server Supabase client.
 *
 * Use in: Server Components, Server Actions, Route Handlers.
 * Uses the anon key + user session cookies — respects RLS.
 * Each call creates a fresh client bound to the current request's cookies.
 *
 * @example
 *   import { createServerClient } from '@/src/lib/supabase/server'
 *   const supabase = await createServerClient()
 */

import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/src/types/database';
import { env } from '@/src/lib/env';

export async function createServerClient() {
  const cookieStore = await cookies();

  return _createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // The middleware handles session refresh, so this is safe to ignore.
          }
        },
      },
    }
  );
}
