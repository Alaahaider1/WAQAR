/**
 * POST /api/cloudinary/sign
 *
 * Returns a signed upload signature so the admin browser can upload
 * images directly to Cloudinary without routing binaries through our server.
 *
 * Requires: admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/auth/guards';
import { validate, ImageUploadSchema } from '@/src/validations';
import { AuthError, ForbiddenError, ValidationError, StorageError } from '@/src/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const input = validate(ImageUploadSchema, body);

    // Lazy import Cloudinary — only runs when the route is actually called
    // (not at build time / static generation)
    const { generateSignedUploadParams } = await import('@/src/lib/cloudinary');
    const params = generateSignedUploadParams(input.folder);

    return NextResponse.json(params, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, fieldErrors: error.fieldErrors },
        { status: 422 }
      );
    }
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }
    console.error('[cloudinary/sign]', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
