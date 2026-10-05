#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Supabase URL and keys are required in the environment.');

const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const anonymous = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const customer = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const uuid = crypto.randomUUID();
const storage = service.storage.from('ugc-videos');
const visiblePath = `uploads/2026-10-04/${uuid}.mp4`;
const hiddenPath = `uploads/2026-10-04/${crypto.randomUUID()}.mp4`;
const deniedUploadPath = `uploads/2026-10-04/${crypto.randomUUID()}.mp4`;
const videoBytes = Buffer.from('UGC security regression object');
const visibleUrl = storage.getPublicUrl(visiblePath).data.publicUrl;
const hiddenUrl = storage.getPublicUrl(hiddenPath).data.publicUrl;
const testEmail = `ugc-security-${uuid}@waqar.invalid`;
const testPassword = `${crypto.randomUUID()}A9!`;
let customerId;
const videoIds = [];

async function expectPrivateColumnDenied(client) {
  const { error } = await client.from('ugc_videos').select('storage_path').limit(1);
  assert.ok(error, 'non-service clients must not read storage_path');
}

async function verifyClientCannotMutate(client, label) {
  const inserted = await client.from('ugc_videos').insert({
    video_url: visibleUrl,
    storage_path: deniedUploadPath,
    caption: `${label} insert`,
  });
  assert.ok(inserted.error, `${label} insert must be rejected`);

  const updated = await client.from('ugc_videos').update({ caption: `${label} attack` }).eq('video_url', visibleUrl);
  assert.ifError(updated.error);
  const deleted = await client.from('ugc_videos').delete().eq('video_url', visibleUrl);
  assert.ifError(deleted.error);

  const stored = await service.from('ugc_videos').select('caption').eq('id', videoIds[0]).single();
  assert.ifError(stored.error);
  assert.equal(stored.data.caption, 'security baseline', `${label} update/delete must not affect the test video`);

  const upload = await client.storage.from('ugc-videos').upload(deniedUploadPath, videoBytes, {
    contentType: 'video/mp4',
    upsert: false,
  });
  assert.ok(upload.error, `${label} Storage upload must be rejected`);

  const overwrite = await client.storage.from('ugc-videos').update(visiblePath, Buffer.from('tampered'), {
    contentType: 'video/mp4',
    upsert: true,
  });
  assert.ok(overwrite.error, `${label} Storage update must be rejected`);

  const remove = await client.storage.from('ugc-videos').remove([visiblePath]);
  assert.ifError(remove.error);
  const stillPresent = await storage.download(visiblePath);
  assert.ifError(stillPresent.error);
  assert.deepEqual(Buffer.from(await stillPresent.data.arrayBuffer()), videoBytes);
}

try {
  for (const path of [visiblePath, hiddenPath]) {
    const upload = await storage.upload(path, videoBytes, { contentType: 'video/mp4', upsert: false });
    if (upload.error) throw upload.error;
  }

  const visible = await service.from('ugc_videos').insert({
    video_url: visibleUrl,
    storage_path: visiblePath,
    caption: 'security baseline',
    position: 0,
    is_visible: true,
  }).select('id').single();
  if (visible.error) throw visible.error;
  videoIds.push(visible.data.id);

  const hidden = await service.from('ugc_videos').insert({
    video_url: hiddenUrl,
    storage_path: hiddenPath,
    caption: 'hidden security fixture',
    position: 0,
    is_visible: false,
  }).select('id').single();
  if (hidden.error) throw hidden.error;
  videoIds.push(hidden.data.id);

  const created = await service.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    app_metadata: { role: 'customer' },
  });
  if (created.error) throw created.error;
  customerId = created.data.user.id;
  const signedIn = await customer.auth.signInWithPassword({ email: testEmail, password: testPassword });
  if (signedIn.error) throw signedIn.error;

  for (const [client, label] of [[anonymous, 'anonymous'], [customer, 'customer']]) {
    await expectPrivateColumnDenied(client);
    const publicRows = await client.from('ugc_videos')
      .select('video_url, customer_name, caption, position, is_visible')
      .order('position');
    assert.ifError(publicRows.error);
    assert.ok(publicRows.data.every(row => row.is_visible), `${label} can read only visible UGC rows`);
    assert.ok(publicRows.data.every(row => !('storage_path' in row) && !('created_at' in row) && !('updated_at' in row)));
    await verifyClientCannotMutate(client, label);
  }

  const publicRead = await fetch(visibleUrl);
  assert.equal(publicRead.status, 200, 'public UGC video URLs must remain readable');

  const adminDelete = await storage.remove([visiblePath]);
  assert.ifError(adminDelete.error);
  const missingDelete = await storage.remove([visiblePath]);
  assert.ifError(missingDelete.error);
  const deletedRow = await service.from('ugc_videos').delete().eq('id', videoIds[0]);
  assert.ifError(deletedRow.error);
  videoIds.shift();
  console.log('PASS: anon/customer database reads and mutations, Storage mutations, public video read, admin cleanup, missing-object cleanup');
} finally {
  if (videoIds.length) await service.from('ugc_videos').delete().in('id', videoIds);
  await storage.remove([visiblePath, hiddenPath, deniedUploadPath]);
  if (customerId) await service.auth.admin.deleteUser(customerId);
}
