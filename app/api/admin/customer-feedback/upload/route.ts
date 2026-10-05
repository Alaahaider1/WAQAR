import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { StorageError, WaqarError } from '@/src/lib/errors';

export const runtime = 'nodejs';

const BUCKET = 'customer-feedback';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

function failure(message: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error: `Customer feedback upload failed: ${message}`, code }, { status });
}

export async function POST(request: Request) {
  try { await requireAdmin(); }
  catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('Unauthorized', 'UNAUTHORIZED', 401);
    return failure(known.message, known.code, known.statusCode);
  }
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.startsWith('multipart/form-data;') || !contentType.includes('boundary=')) {
    return failure('request is not multipart/form-data with a boundary', 'INVALID_MULTIPART_REQUEST');
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return failure('multipart body could not be parsed', 'MULTIPART_PARSE_FAILED'); }

  const image = formData.get('image');
  if (!(image instanceof File)) return failure('image field is missing or invalid', 'MISSING_IMAGE_FILE');
  if (!image.size) return failure('image file is empty', 'EMPTY_IMAGE_FILE');
  if (image.size > MAX_IMAGE_BYTES) return failure('image files must be 10MB or smaller', 'IMAGE_FILE_TOO_LARGE', 413);

  const extension = EXTENSION_BY_TYPE[image.type.toLowerCase()] ?? image.name.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[1]?.replace('jpeg', 'jpg');
  if (!extension) return failure('upload a JPG, PNG, or WebP image', 'INVALID_IMAGE_FILE');

  try {
    const bytes = Buffer.from(await image.arrayBuffer());
    const detectedType = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      ? 'image/jpeg'
      : bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        ? 'image/png'
        : bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
          ? 'image/webp'
          : null;
    if (!detectedType || EXTENSION_BY_TYPE[detectedType] !== extension) {
      return failure('file contents do not match a supported image type', 'INVALID_IMAGE_CONTENT');
    }
    const storagePath = `screenshots/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const storage = createAdminClient().storage.from(BUCKET);
    const { error } = await storage.upload(storagePath, bytes, { contentType: detectedType, cacheControl: '31536000', upsert: false });
    if (error) throw new StorageError(error.message);
    const { data } = storage.getPublicUrl(storagePath);
    if (!data.publicUrl) throw new StorageError('public URL could not be created');
    return NextResponse.json({ success: true, data: { imageUrl: data.publicUrl, storagePath } });
  } catch (error) {
    const known = error instanceof WaqarError ? error : new WaqarError('failed to read image file', 'IMAGE_READ_FAILED');
    return failure(known.message, known.code, known.statusCode);
  }
}
