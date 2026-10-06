import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { isManagedUgcStoragePath, ugcStoragePathFromPublicUrl } from '../src/lib/ugc-video-storage.ts';

const projectUrl = 'https://project.supabase.co';
const videoPath = 'uploads/2026-10-04/123e4567-e89b-12d3-a456-426614174000.mp4';

test('UGC URL parsing only accepts app-generated objects from the configured bucket', () => {
  assert.equal(
    ugcStoragePathFromPublicUrl(`${projectUrl}/storage/v1/object/public/ugc-videos/${videoPath}`, projectUrl),
    videoPath,
  );
  assert.equal(ugcStoragePathFromPublicUrl(`https://attacker.example/storage/v1/object/public/ugc-videos/${videoPath}`, projectUrl), null);
  assert.equal(ugcStoragePathFromPublicUrl(`${projectUrl}/storage/v1/object/public/other/${videoPath}`, projectUrl), null);
  assert.equal(ugcStoragePathFromPublicUrl(`${projectUrl}/prefix/storage/v1/object/public/ugc-videos/${videoPath}`, projectUrl), null);
  assert.equal(ugcStoragePathFromPublicUrl(`${projectUrl}/storage/v1/object/public/ugc-videos/uploads/%2e%2e/private.mp4`, projectUrl), null);
  assert.equal(ugcStoragePathFromPublicUrl(`${projectUrl}/storage/v1/object/public/ugc-videos/${videoPath}?token=secret`, projectUrl), null);
});

test('only generated UGC paths are eligible for server-side replacement or deletion', () => {
  assert.equal(isManagedUgcStoragePath(videoPath), true);
  assert.equal(isManagedUgcStoragePath('someone-elses/private.mp4'), false);
  assert.equal(isManagedUgcStoragePath('../uploads/2026-10-04/123e4567-e89b-12d3-a456-426614174000.mp4'), false);
});

test('UGC browser payloads exclude Storage paths and audit timestamps', () => {
  const repository = readFileSync(new URL('../src/repositories/ugc-video.repository.ts', import.meta.url), 'utf8');
  const browser = readFileSync(new URL('../components/home/UgcVideoTestimonials.tsx', import.meta.url), 'utf8');
  const adminPage = readFileSync(new URL('../app/admin/ugc-videos/page.tsx', import.meta.url), 'utf8');
  assert.match(repository, /select\('video_url, customer_name, caption, position, is_visible'\)/);
  assert.match(repository, /select\('id, video_url, customer_name, caption, position, is_visible'\)/);
  assert.doesNotMatch(browser, /storagePath|storage_path|createdAt|updatedAt/);
  assert.match(adminPage, /await requireAdmin\(\)/);
});

test('UGC video bytes upload directly to Storage and browser form never receives storage_path', () => {
  const client = readFileSync(new URL('../app/admin/ugc-videos/UgcVideosClient.tsx', import.meta.url), 'utf8');
  assert.equal(existsSync(new URL('../app/api/admin/ugc-videos/upload/route.ts', import.meta.url)), false);
  assert.match(client, /createBrowserClient\(\)\.storage\.from\(UGC_BUCKET\)/);
  assert.match(client, /storage\.upload\(path, file/);
  assert.match(client, /50 \* 1024 \* 1024/);
  assert.match(client, /uploads\/\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}\/\$\{crypto\.randomUUID\(\)\}/);
  assert.doesNotMatch(client, /fetch\(['"]\/api\/admin\/ugc-videos\/upload/);
  assert.doesNotMatch(client, /SUPABASE_SERVICE_ROLE_KEY|createAdminClient/);
  assert.doesNotMatch(client, /storagePath|storage_path/);
});

test('UGC admin cards render full-width Edit and Delete actions with safe confirmation', () => {
  const client = readFileSync(new URL('../app/admin/ugc-videos/UgcVideosClient.tsx', import.meta.url), 'utf8');
  assert.match(client, /aria-label="Edit video"/);
  assert.match(client, /> EDIT<\/button>/);
  assert.match(client, /cardAction\('Edit', '#B8965A'\)/);
  assert.match(client, /VideoForm initial=\{\{ videoUrl: video\.videoUrl, customerName: video\.customerName/);
  assert.match(client, /updateUgcVideoAction\(id, data\)/);
  assert.match(client, /aria-label="Delete video"/);
  assert.match(client, /> DELETE<\/button>/);
  assert.match(client, /cardAction\('Delete', '#B33'\)/);
  assert.match(client, /width: '100%', boxSizing: 'border-box', gap: 8, padding: '0 14px 14px'/);
  assert.match(client, /Delete this UGC video\? The video file and its testimonial data will be permanently removed\./);
  assert.match(client, /role="alertdialog"/);
  assert.match(client, /deleteUgcVideoAction\(id\)/);
  assert.match(client, /router\.refresh\(\)/);
});

test('every UGC server action checks admin before privileged work', () => {
  const actions = readFileSync(new URL('../src/actions/ugc-video.actions.ts', import.meta.url), 'utf8');
  assert.equal((actions.match(/await requireAdmin\(\)/g) ?? []).length, 3);
  assert.match(actions, /safeFailure\(error, 'Could not delete the UGC video/);
  const deletion = actions.slice(actions.indexOf('export async function deleteUgcVideoAction'));
  assert.ok(deletion.indexOf('await requireAdmin()') < deletion.indexOf('createAdminClient()'));
  assert.match(deletion, /validate\(VideoIdSchema, rawId\)/);
  assert.match(deletion, /await removeStoredVideo\(video\.storagePath\)/);
  assert.match(deletion, /await repo\.delete\(id\)/);
  assert.match(actions, /error\.statusCode !== '404'/);
});

test('UGC production failures are sanitized before returning to clients', () => {
  const actions = readFileSync(new URL('../src/actions/ugc-video.actions.ts', import.meta.url), 'utf8');
  assert.match(actions, /console\.error\('\[ugc-videos\] server operation failed', error\)/);
  assert.doesNotMatch(actions, /return actionError\(error\)/);
});

test('public UGC database grants exclude internal storage and audit columns', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20261004120000_harden_ugc_public_read.sql', import.meta.url), 'utf8');
  assert.match(migration, /revoke select on public\.ugc_videos from public, anon, authenticated/i);
  assert.match(migration, /grant select \(video_url, customer_name, caption, position, is_visible\)/i);
  assert.doesNotMatch(migration, /grant select \([^)]*\b(storage_path|created_at|updated_at|id)\b/i);
});
