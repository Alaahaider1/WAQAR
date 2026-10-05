/**
 * Admin Layout — Server Component wrapper.
 *
 * Reads the authenticated user from the Supabase session and passes
 * it to the AdminShell client component. The auth guard here is a
 * defence-in-depth check — the proxy already redirects unauthenticated
 * requests before they reach this component.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/src/lib/supabase/server';
import { AdminShell } from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Defence-in-depth: proxy should have already redirected, but guard here too
  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  const role = (user.app_metadata?.role as string | undefined) ?? 'customer';
  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/?error=unauthorized');
  }

  // Fetch real profile data for the sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Admin';
  const displayEmail = profile?.email || user.email || '';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AdminShell
      user={{ displayName, displayEmail, initials, role }}
    >
      {children}
    </AdminShell>
  );
}
