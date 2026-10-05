import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { StorageError, WaqarError } from '@/src/lib/errors';

export const runtime = 'nodejs';

const BUCKET = 'category-images';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function failure(message: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error: `Category image upload failed: ${message}`, code }, { status });
}

function detectImageType(bytes: Buffer): string | null {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('Unauthorized', 'UNAUTHORIZED', 401);
    return failure(known.message, known.code, known.statusCode);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data;') || !contentType.includes('boundary=')) {
    return failure('request must be multipart/form-data', 'INVALID_MULTIPART_REQUEST');
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return failure('image files must be 10 MB or smaller', 'IMAGE_FILE_TOO_LARGE', 413);
  }

  let formData: FormData;
  try {
    const reader = request.body?.getReader();
    if (!reader) return failure('multipart body is missing', 'MULTIPART_PARSE_FAILED');
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        return failure('image files must be 10 MB or smaller', 'IMAGE_FILE_TOO_LARGE', 413);
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    formData = await new Response(body, { headers: { 'content-type': contentType } }).formData();
  } catch {
    return failure('multipart body could not be parsed', 'MULTIPART_PARSE_FAILED');
  }

  const image = formData.get('image');
  if (!(image instanceof File)) return failure('image file is missing or invalid', 'MISSING_IMAGE_FILE');
  if (!image.size) return failure('image file is empty', 'EMPTY_IMAGE_FILE');
  if (image.size > MAX_IMAGE_BYTES) return failure('image files must be 10 MB or smaller', 'IMAGE_FILE_TOO_LARGE', 413);

  const declaredType = image.type.toLowerCase();
  if (!Object.hasOwn(EXTENSION_BY_TYPE, declaredType)) {
    return failure('upload a JPEG, PNG, or WebP image', 'INVALID_IMAGE_FILE');
  }

  try {
    const bytes = Buffer.from(await image.arrayBuffer());
    const detectedType = detectImageType(bytes);
    if (!detectedType || detectedType !== declaredType) {
      return failure('file contents do not match the declared image type', 'INVALID_IMAGE_CONTENT');
    }

    const extension = EXTENSION_BY_TYPE[detectedType];
    const storagePath = `categories/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const storage = createAdminClient().storage.from(BUCKET);
    const { error } = await storage.upload(storagePath, bytes, {
      contentType: detectedType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw new StorageError(error.message);

    const { data } = storage.getPublicUrl(storagePath);
    if (!data.publicUrl) throw new StorageError('public URL could not be created');
    return NextResponse.json({ success: true, data: { imageUrl: data.publicUrl } });
  } catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('failed to store image', 'IMAGE_UPLOAD_FAILED');
    return failure(known.message, known.code, known.statusCode);
  }
}
