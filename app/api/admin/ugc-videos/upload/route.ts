import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { StorageError, WaqarError } from '@/src/lib/errors';

export const runtime = 'nodejs';

const UGC_BUCKET = 'ugc-videos';
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_VIDEO_BYTES + 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  'video/mp4': 'mp4', 'application/mp4': 'mp4', 'video/x-m4v': 'mp4',
  'video/webm': 'webm', 'video/quicktime': 'mov',
};

function failure(message: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error: `UGC upload failed: ${message}`, code }, { status });
}

function extensionFor(file: File) {
  const fromMimeType = EXTENSION_BY_TYPE[file.type.toLowerCase()];
  if (fromMimeType) return fromMimeType;
  const fromName = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return fromName === 'mp4' || fromName === 'webm' || fromName === 'mov' ? fromName : null;
}

/** Browser-native multipart endpoint. Its request body is parsed exactly once. */
export async function POST(request: Request) {
  try { await requireAdmin(); }
  catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('Unauthorized', 'UNAUTHORIZED', 401);
    return failure(known.message, known.code, known.statusCode);
  }
  const contentType = request.headers.get('content-type') ?? '';
  const contentLength = Number(request.headers.get('content-length'));
  if (!contentType.startsWith('multipart/form-data;') || !contentType.includes('boundary=')) {
    return failure('request is not multipart/form-data with a boundary', 'INVALID_MULTIPART_REQUEST');
  }
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return failure('file size exceeds the 50MB limit', 'VIDEO_FILE_TOO_LARGE', 413);
  }

  let formData: FormData;
  try {
    const reader = request.body?.getReader();
    if (!reader) return failure('upload request is empty', 'MULTIPART_PARSE_FAILED');
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        return failure('file size exceeds the 50MB limit', 'VIDEO_FILE_TOO_LARGE', 413);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    formData = await new Response(bytes, { headers: { 'content-type': contentType } }).formData();
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown multipart parser error';
    console.error('[ugc-upload] multipart parsing failed', { reason, contentType, contentLength });
    return failure('upload request could not be processed', 'MULTIPART_PARSE_FAILED');
  }

  const video = formData.get('video');
  if (video === null) return failure('video field is missing', 'MISSING_VIDEO_FIELD');
  if (!(video instanceof File)) return failure('video field is not a file', 'VIDEO_FIELD_NOT_FILE');
  if (video.size === 0) return failure('video file size is 0 bytes', 'EMPTY_VIDEO_FILE');
  if (video.size > MAX_VIDEO_BYTES) return failure('file size exceeds the 50MB limit', 'VIDEO_FILE_TOO_LARGE', 413);

  const extension = extensionFor(video);
  if (!extension) return failure('upload an MP4, WebM, or MOV video file', 'UNSUPPORTED_VIDEO_TYPE');

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await video.arrayBuffer());
  } catch (error) {
    console.error('[ugc-upload] file read failed', error);
    return failure('selected video could not be read', 'VIDEO_READ_FAILED');
  }
  if (bytes.byteLength === 0) return failure('selected file read as 0 bytes', 'EMPTY_VIDEO_BYTES');

  try {
    const storagePath = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const storage = createAdminClient().storage.from(UGC_BUCKET);
    const { error: uploadError } = await storage.upload(storagePath, bytes, {
      contentType: video.type || `video/${extension}`,
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) throw new StorageError(uploadError.message);
    const { data } = storage.getPublicUrl(storagePath);
    if (!data.publicUrl) throw new StorageError('public URL could not be created');
    return NextResponse.json({ success: true, data: { videoUrl: data.publicUrl } });
  } catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('unknown upload failure', 'UGC_UPLOAD_FAILED');
    console.error('[ugc-upload] storage upload failed', error);
    return failure('video could not be uploaded. Please try again.', known.code, known.statusCode);
  }
}
