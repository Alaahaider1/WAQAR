/**
 * Browser Supabase client.
 *
 * Use in: "use client" components only.
 * Uses the anon key — subject to RLS.
 *
 * Singleton pattern: one client per browser session.
 *
 * @example
 *   import { createBrowserClient } from '@/src/lib/supabase/client'
 *   const supabase = createBrowserClient()
 */

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/src/types/database';

// Lazily read the public env vars — safe because this file is client-side
// (Next.js statically inlines NEXT_PUBLIC_* at build time)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
        'Add them to .env.local'
    );
  }

  return _createBrowserClient<Database>(url, key);
}
