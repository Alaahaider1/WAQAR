#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.UGC_ADMIN_RENDER_URL ?? 'http://127.0.0.1:3000';
if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Supabase URL and keys are required in the environment.');

const service = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const id = crypto.randomUUID();
const email = `ugc-render-${id}@waqar.invalid`;
const password = `${crypto.randomUUID()}A9!`;
const path = `uploads/${new Date().toISOString().slice(0, 10)}/${id}.mp4`;
const storage = service.storage.from('ugc-videos');
const videoUrl = storage.getPublicUrl(path).data.publicUrl;
let adminId;
let rowId;
let objectCreated = false;

try {
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (created.error) throw created.error;
  adminId = created.data.user.id;

  let sessionCookies = [];
  const adminSessionClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: cookies => { sessionCookies = cookies; },
    },
  });
  const signedIn = await adminSessionClient.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  const cookieHeader = sessionCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  assert.ok(cookieHeader, 'Supabase SSR should provide auth cookies for the temporary admin');

  const uploaded = await storage.upload(path, Buffer.from('route render fixture'), {
    contentType: 'video/mp4',
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  objectCreated = true;

  const inserted = await service.from('ugc_videos').insert({
    video_url: videoUrl,
    storage_path: path,
    customer_name: 'Temporary render check',
    caption: 'Temporary route render fixture',
    position: 999999,
    is_visible: false,
  }).select('id').single();
  if (inserted.error) throw inserted.error;
  rowId = inserted.data.id;

  const response = await fetch(`${appUrl}/admin/ugc-videos`, { headers: { cookie: cookieHeader }, redirect: 'manual' });
  assert.equal(response.status, 200, 'authenticated admin should render the protected UGC page');
  const html = await response.text();
  assert.match(html, /aria-label="Edit video"[^>]*>[\s\S]*?EDIT/);
  assert.match(html, /aria-label="Delete video"[^>]*>[\s\S]*?DELETE/);
  assert.match(html, /Temporary render check/);
  console.log('PASS: authenticated /admin/ugc-videos response contains the rendered fixture card and visible EDIT / DELETE buttons');
} finally {
  if (rowId) await service.from('ugc_videos').delete().eq('id', rowId);
  if (objectCreated) await storage.remove([path]);
  if (adminId) await service.auth.admin.deleteUser(adminId);
}
