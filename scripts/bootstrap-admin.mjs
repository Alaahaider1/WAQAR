#!/usr/bin/env node
/**
 * WAQAR — Admin Bootstrap Script
 *
 * Creates the initial super_admin account in Supabase Auth and
 * inserts the matching profile + admin_users rows.
 *
 * Run ONCE after deploying the schema:
 *   node scripts/bootstrap-admin.mjs
 *
 * Or with custom credentials:
 *   ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD=yourpass node scripts/bootstrap-admin.mjs
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL     — in .env.local
 *   SUPABASE_SERVICE_ROLE_KEY    — in .env.local (bypasses RLS / Auth checks)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    console.log('✓ Loaded .env.local');
  } catch {
    console.log('⚠ No .env.local found — relying on process.env');
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function bootstrap() {
  console.log('\n── WAQAR Admin Bootstrap ──────────────────────────');
  console.log(`URL:   ${SUPABASE_URL}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log('────────────────────────────────────────────────────\n');

  // 1. Check if user already exists in Auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('✗ Cannot list users:', listErr.message);
    process.exit(1);
  }

  let userId;
  const existing = users.find(u => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log(`✓ Auth user already exists: ${existing.id}`);
    userId = existing.id;

    // Ensure app_metadata.role is super_admin
    const { error: metaErr } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'super_admin' },
    });
    if (metaErr) console.warn('⚠ Could not update app_metadata:', metaErr.message);
    else console.log('✓ app_metadata.role = super_admin confirmed');

  } else {
    // 2. Create Auth user
    console.log('Creating Supabase Auth user…');
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,           // skip email confirmation
      app_metadata: { role: 'super_admin' },
      user_metadata: { full_name: ADMIN_FULL_NAME },
    });

    if (createErr || !created.user) {
      console.error('✗ Failed to create Auth user:', createErr?.message);
      process.exit(1);
    }

    userId = created.user.id;
    console.log(`✓ Auth user created: ${userId}`);
  }

  // 3. Upsert profile row
  console.log('Upserting profile row…');
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: ADMIN_FULL_NAME,
      role: 'super_admin',
      is_active: true,
    }, { onConflict: 'id' });

  if (profileErr) {
    console.error('✗ Profile upsert failed:', profileErr.message);
    process.exit(1);
  }
  console.log('✓ Profile row upserted');

  // 4. Upsert admin_users row
  console.log('Upserting admin_users row…');
  const { error: adminErr } = await supabase
    .from('admin_users')
    .upsert({
      user_id: userId,
      role: 'super_admin',
      notes: 'Bootstrapped by setup script',
    }, { onConflict: 'user_id' });

  if (adminErr) {
    console.error('✗ admin_users upsert failed:', adminErr.message);
    process.exit(1);
  }
  console.log('✓ admin_users row upserted');

  // 5. Verify
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  console.log('\n── Verification ────────────────────────────────────');
  console.log('Profile:', JSON.stringify(profile, null, 2));
  console.log('\n✅ Bootstrap complete!\n');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n   ⚠  Change the password immediately after first login.');
  console.log('────────────────────────────────────────────────────\n');
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
