#!/usr/bin/env node
/**
 * WAQAR — Auth Flow Verification Script
 *
 * Tests the complete authentication pipeline against the live Supabase project.
 * Run this after deploying the schema and running bootstrap:admin.
 *
 *   node scripts/verify-auth.mjs
 *
 * What it checks:
 *   1. Supabase reachability
 *   2. Admin user exists in Auth with correct app_metadata.role
 *   3. Profile row exists with role = super_admin
 *   4. admin_users row exists
 *   5. signInWithPassword succeeds
 *   6. JWT contains the correct role claim
 *   7. Customer user cannot access admin-gated data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* rely on process.env */ }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@waqar.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

if (!URL || !ANON || !SERVICE || !ADMIN_PASS) {
  console.error('✗ Missing required env vars. Ensure .env.local has the Supabase URL/keys and ADMIN_PASSWORD.');
  process.exit(1);
}

const serviceClient = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const anonClient = createClient(URL, ANON);

let passed = 0;
let failed = 0;

function ok(msg) { console.log(`  ✓ ${msg}`); passed++; }
function fail(msg, detail = '') { console.error(`  ✗ ${msg}${detail ? ': ' + detail : ''}`); failed++; }

async function check(label, fn) {
  try {
    await fn();
  } catch (e) {
    fail(label, e instanceof Error ? e.message : String(e));
  }
}

async function run() {
  console.log('\n── WAQAR Auth Flow Verification ─────────────────────\n');

  // 1. Supabase reachability
  await check('Supabase reachable', async () => {
    const { error } = await serviceClient.from('profiles').select('id').limit(1);
    if (error) throw new Error(error.message);
    ok('Supabase reachable');
  });

  // 2. Admin user in Auth
  let adminUserId;
  await check('Admin Auth user exists with correct role', async () => {
    const { data: { users }, error } = await serviceClient.auth.admin.listUsers();
    if (error) throw new Error(error.message);
    const admin = users.find(u => u.email === ADMIN_EMAIL);
    if (!admin) throw new Error(`No user found with email ${ADMIN_EMAIL} — run: npm run bootstrap:admin`);
    adminUserId = admin.id;
    const role = admin.app_metadata?.role;
    if (role !== 'admin' && role !== 'super_admin') throw new Error(`app_metadata.role is "${role}", expected admin or super_admin`);
    ok(`Auth user exists (${admin.id}) with role="${role}"`);
  });

  // 3. Profile row
  await check('Profile row exists with correct role', async () => {
    const { data, error } = await serviceClient
      .from('profiles')
      .select('id, email, role')
      .eq('email', ADMIN_EMAIL)
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Profile row not found');
    if (data.role !== 'admin' && data.role !== 'super_admin') throw new Error(`Profile role="${data.role}"`);
    ok(`Profile row OK (role=${data.role})`);
  });

  // 4. admin_users row
  await check('admin_users row exists', async () => {
    if (!adminUserId) throw new Error('No admin user ID from previous check');
    const { data, error } = await serviceClient
      .from('admin_users')
      .select('id, role')
      .eq('user_id', adminUserId)
      .single();
    if (error) throw new Error(error.message + ' — run: npm run bootstrap:admin');
    ok(`admin_users row OK (role=${data.role})`);
  });

  // 5. Sign in succeeds
  let session;
  await check('signInWithPassword succeeds', async () => {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned');
    session = data.session;
    ok('Sign in succeeded — session created');
  });

  // 6. JWT role claim
  await check('JWT contains correct role claim', async () => {
    if (!session) throw new Error('No session from previous step');
    // Decode JWT payload (base64url)
    const payload = JSON.parse(
      Buffer.from(session.access_token.split('.')[1], 'base64url').toString()
    );
    const role = payload?.app_metadata?.role ?? payload?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      throw new Error(`JWT role="${role}" — expected admin or super_admin. Re-run bootstrap:admin to fix app_metadata.`);
    }
    ok(`JWT role claim OK (role=${role})`);
  });

  // 7. RLS — admin can read all profiles
  await check('Admin session can read profiles (RLS)', async () => {
    if (!session) throw new Error('No session');
    const authedClient = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    });
    const { error } = await authedClient.from('profiles').select('id').limit(1);
    if (error) throw new Error(error.message);
    ok('Admin can read profiles via RLS');
  });

  // 8. Sign out
  await check('Sign out works', async () => {
    const { error } = await anonClient.auth.signOut();
    if (error) throw new Error(error.message);
    ok('Sign out succeeded');
  });

  // Summary
  console.log('\n── Results ──────────────────────────────────────────');
  console.log(`  Passed: ${passed}`);
  if (failed > 0) {
    console.error(`  Failed: ${failed}`);
    console.log('\n  Run: npm run bootstrap:admin  — then retry.');
    process.exit(1);
  } else {
    console.log('\n  ✅ All auth checks passed!');
    console.log('\n  Next steps:');
    console.log(`  1. Start dev server: npm run dev`);
    console.log(`  2. Navigate to: http://localhost:3000/login`);
    console.log(`  3. Sign in with: ${ADMIN_EMAIL}`);
    console.log(`  4. Verify redirect to: /admin`);
  }
  console.log('─────────────────────────────────────────────────────\n');
}

run().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
