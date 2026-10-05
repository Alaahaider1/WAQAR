/**
 * Cloudinary integration.
 *
 * Handles image upload and deletion via the Cloudinary API.
 * All server-side — the API secret never reaches the browser.
 *
 * Folder structure:
 *   waqar/products/{product-slug}/
 *   waqar/categories/
 *   waqar/avatars/
 */

import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/src/lib/env';
import { StorageError } from '@/src/lib/errors';

// ---------------------------------------------------------------------------
// Configuration — runs once at module load
// ---------------------------------------------------------------------------

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedImage {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadOptions {
  /** Cloudinary folder path, e.g. "waqar/products/golden-light" */
  folder: string;
  /** Public ID override — auto-generated if omitted */
  publicId?: string;
  /** Allowed formats — defaults to jpg, webp, png */
  allowedFormats?: string[];
  /** Max file size in bytes — defaults to 10 MB */
  maxBytes?: number;
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

// ---------------------------------------------------------------------------
// Server-side upload (from a URL or base64 string)
// Used by Server Actions when admin pastes a URL or uploads from the form.
// ---------------------------------------------------------------------------

export async function uploadFromUrl(
  sourceUrl: string,
  options: UploadOptions
): Promise<UploadedImage> {
  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: options.folder,
      public_id: options.publicId,
      allowed_formats: options.allowedFormats ?? ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'image',
      overwrite: false,
      unique_filename: !options.publicId,
      use_filename: !!options.publicId,
      quality: 'auto',
      fetch_format: 'auto',
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    throw new StorageError(`Cloudinary upload failed: ${message}`);
  }
}

/**
 * Upload a Buffer or base64-encoded string (from a multipart form).
 */
export async function uploadBuffer(
  data: Buffer | string,
  options: UploadOptions
): Promise<UploadedImage> {
  try {
    // Wrap Buffer in a data URI if needed
    const source =
      Buffer.isBuffer(data)
        ? `data:image/jpeg;base64,${data.toString('base64')}`
        : data;

    return uploadFromUrl(source, options);
  } catch (error) {
    if (error instanceof StorageError) throw error;
    const message = error instanceof Error ? error.message : 'Upload failed';
    throw new StorageError(`Cloudinary upload failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Delete an image by its public_id
// ---------------------------------------------------------------------------

export async function deleteImage(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new StorageError(`Cloudinary deletion returned: ${result.result}`);
    }
  } catch (error) {
    if (error instanceof StorageError) throw error;
    const message = error instanceof Error ? error.message : 'Deletion failed';
    throw new StorageError(`Cloudinary delete failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Generate a signed upload signature for client-side direct uploads.
// The browser sends the file directly to Cloudinary — our server never
// receives the binary. Used by the admin image upload widget.
// ---------------------------------------------------------------------------

export function generateSignedUploadParams(folder: string): SignedUploadParams {
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
  };
}

// ---------------------------------------------------------------------------
// URL transformation helpers
// These build Cloudinary transformation URLs without an API call.
// ---------------------------------------------------------------------------

const BASE = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

type TransformPreset = 'card' | 'hero' | 'thumb' | 'avatar';

const TRANSFORMS: Record<TransformPreset, string> = {
  card:   'w_600,h_700,c_fill,g_auto,q_auto,f_auto',
  hero:   'w_1200,h_1400,c_fill,g_auto,q_auto,f_auto',
  thumb:  'w_120,h_140,c_fill,g_auto,q_auto,f_auto',
  avatar: 'w_96,h_96,c_fill,g_face,q_auto,f_auto,r_max',
};

/**
 * Build a Cloudinary transformation URL from a public_id.
 *
 * @example
 *   buildImageUrl('waqar/products/golden-light/main', 'card')
 *   // → https://res.cloudinary.com/waqar/image/upload/w_600,h_700,.../main
 */
export function buildImageUrl(publicId: string, preset: TransformPreset = 'card'): string {
  return `${BASE}/${TRANSFORMS[preset]}/${publicId}`;
}

/**
 * Extract the Cloudinary public_id from a full secure URL.
 * Useful when the stored value is a URL rather than a public_id.
 */
export function extractPublicId(secureUrl: string): string | null {
  try {
    const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
