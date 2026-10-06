'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { env } from '@/src/lib/env';
import { UgcVideoRepository } from '@/src/repositories/ugc-video.repository';
import { validate, UgcVideoSchema } from '@/src/validations';
import { actionSuccess, AuthError, ForbiddenError, NotFoundError, ValidationError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import { isManagedUgcStoragePath, ugcStoragePathFromPublicUrl } from '@/src/lib/ugc-video-storage';

const UGC_BUCKET = 'ugc-videos';
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4', 'application/mp4': 'mp4', 'video/x-m4v': 'mp4',
  'video/webm': 'webm', 'video/quicktime': 'mov',
};
const MIME_BY_EXTENSION: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
const VideoIdSchema = z.string().uuid('Invalid video ID');

function revalidate() {
  updateTag('storefront-ugc-videos');
  revalidatePath('/admin/ugc-videos', 'page');
  revalidatePath('/', 'page');
}

function safeFailure(error: unknown, fallback: string): Extract<ActionResult<never>, { success: false }> {
  if (error instanceof AuthError) return { success: false, error: 'Sign in to continue.', code: 'AUTH_REQUIRED' };
  if (error instanceof ForbiddenError) return { success: false, error: 'You do not have permission to manage UGC videos.', code: 'FORBIDDEN' };
  if (error instanceof ValidationError) {
    return { success: false, error: error.message, code: error.code, fieldErrors: error.fieldErrors };
  }
  if (error instanceof NotFoundError) return { success: false, error: 'UGC video not found.', code: 'NOT_FOUND' };
  console.error('[ugc-videos] server operation failed', error);
  return { success: false, error: fallback, code: 'UGC_OPERATION_FAILED' };
}

function requireManagedPath(videoUrl: string): string {
  const path = ugcStoragePathFromPublicUrl(videoUrl, env.NEXT_PUBLIC_SUPABASE_URL);
  if (!path) throw new ValidationError('Choose a video uploaded to Supabase Storage.');
  return path;
}

async function removeStoredVideo(path: string): Promise<void> {
  if (!isManagedUgcStoragePath(path)) return;
  const { error } = await createAdminClient().storage.from(UGC_BUCKET).remove([path]);
  // Supabase Storage remove is idempotent for missing objects. Treat explicit
  // not-found responses the same way to allow cleanup of stale database rows.
  if (error && error.statusCode !== '404') throw error;
}

export async function createUgcVideoUploadTargetAction(
  fileName: string,
  fileType: string,
  fileSize: number,
): Promise<ActionResult<{ path: string; token: string; contentType: string }>> {
  try {
    await requireAdmin();
    if (!Number.isFinite(fileSize) || fileSize <= 0) throw new ValidationError('Please select a video file.');
    if (fileSize > MAX_VIDEO_BYTES) throw new ValidationError('Video files must be 50 MiB or smaller.');

    const extension = VIDEO_EXTENSIONS[fileType.toLowerCase()]
      ?? fileName.toLowerCase().match(/\.(mp4|webm|mov)$/)?.[1];
    if (!extension || !MIME_BY_EXTENSION[extension]) throw new ValidationError('Upload an MP4, WebM, or MOV video file.');

    const path = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await createAdminClient().storage.from(UGC_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;
    return actionSuccess({ path: data.path, token: data.token, contentType: MIME_BY_EXTENSION[extension] });
  } catch (error) {
    return safeFailure(error, 'Could not prepare the video upload. Please try again.');
  }
}

export async function createUgcVideoAction(rawData: unknown): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const input = validate(UgcVideoSchema, rawData);
    const storagePath = requireManagedPath(input.videoUrl);
    await new UgcVideoRepository(createAdminClient()).create(input, storagePath);
    revalidate();
    return actionSuccess(undefined);
  } catch (error) {
    return safeFailure(error, 'Could not save the UGC video. Please try again.');
  }
}

export async function updateUgcVideoAction(rawId: string, rawData: unknown): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const id = validate(VideoIdSchema, rawId);
    const repo = new UgcVideoRepository(createAdminClient());
    const existing = await repo.findById(id);
    const input = validate(UgcVideoSchema.partial(), rawData);
    const videoUrl = input.videoUrl ?? existing.videoUrl;
    const storagePath = videoUrl === existing.videoUrl
      ? existing.storagePath
      : requireManagedPath(videoUrl);

    await repo.update(id, input, storagePath);
    if (videoUrl !== existing.videoUrl && isManagedUgcStoragePath(existing.storagePath)) {
      try {
        await removeStoredVideo(existing.storagePath);
      } catch (error) {
        console.error('[ugc-videos] unable to remove replaced storage file', error);
      }
    }
    revalidate();
    return actionSuccess(undefined);
  } catch (error) {
    return safeFailure(error, 'Could not update the UGC video. Please try again.');
  }
}

export async function deleteUgcVideoAction(rawId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const id = validate(VideoIdSchema, rawId);
    const repo = new UgcVideoRepository(createAdminClient());
    const video = await repo.findById(id);
    try {
      await removeStoredVideo(video.storagePath);
    } catch (error) {
      console.error('[ugc-videos] unable to remove storage file during delete', error);
      throw new WaqarError('UGC video could not be deleted. Please try again.', 'UGC_DELETE_FAILED', 500);
    }
    await repo.delete(id);
    revalidate();
    return actionSuccess(undefined);
  } catch (error) {
    return safeFailure(error, 'Could not delete the UGC video. Please try again.');
  }
}
