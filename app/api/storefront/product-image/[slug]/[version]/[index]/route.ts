import { createHash } from 'node:crypto';
import { createPublicClient } from '@/src/lib/supabase/public';

const IMAGE_DATA_URI = /^data:(image\/(?:avif|gif|jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; version: string; index: string }> },
) {
  const { slug, version, index: indexParam } = await params;
  if (!/^[a-z0-9-]+$/i.test(slug) || !/^[a-f0-9]{20}$/i.test(version)) {
    return new Response('Not found', { status: 404 });
  }

  const index = Number(indexParam);
  if (!Number.isSafeInteger(index) || index < 0 || index > 20) {
    return new Response('Not found', { status: 404 });
  }

  const supabase = createPublicClient();
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  if (productError || !product) return new Response('Not found', { status: 404 });

  const { data: image, error: imageError } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', product.id)
    .order('position')
    .range(index, index)
    .maybeSingle();
  if (imageError) return new Response('Not found', { status: 404 });
  const imageUrl = image?.url ?? null;

  if (!imageUrl) return new Response('Not found', { status: 404 });

  const match = IMAGE_DATA_URI.exec(imageUrl);
  if (!match) return new Response('Not found', { status: 404 });

  const currentVersion = createHash('sha256')
    .update(imageUrl)
    .digest('hex')
    .slice(0, 20);
  if (currentVersion !== version) return new Response('Not found', { status: 404 });

  const imageBytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  return new Response(imageBytes, {
    headers: {
      'Content-Type': match[1].toLowerCase(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
