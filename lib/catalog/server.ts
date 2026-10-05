import { createPublicClient } from '@/src/lib/supabase/public';
import { ProductRepository } from '@/src/repositories/product.repository';
import type { Product as StorefrontProduct } from '@/lib/data/products';
import { domainToStorefrontProduct, rowToStorefrontProduct } from './mapProduct';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { CategoryRepository } from '@/src/repositories/category.repository';
import { CustomerFeedbackRepository } from '@/src/repositories/customer-feedback.repository';
import { UgcVideoRepository } from '@/src/repositories/ugc-video.repository';
import type { Category, CustomerFeedbackImage, PublicUgcVideo } from '@/src/types/domain';
import { NotFoundError } from '@/src/lib/errors';
import { createHash } from 'node:crypto';

// Keep each persistent Data Cache value small. The shared layout still needs
// the complete listing for storefront search/cart consumers, but caching the
// entire result as one value can exceed Next.js's 2 MB per-entry limit.
const CATALOG_PAGE_SIZE = 8;
const CATALOG_CACHE_BATCH_SIZE = 4;

function getCatalogImageUrl(slug: string, source: string | null, index = 0): string {
  if (!source?.startsWith('data:image/')) return source ?? '';
  const version = createHash('sha256').update(source).digest('hex').slice(0, 20);
  return `/api/storefront/product-image/${encodeURIComponent(slug)}/${version}/${index}`;
}

function getCachedStorefrontCatalogPage(page: number) {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('storefront_products')
        .select('id, slug, name, subtitle, category_slug, default_variant_price, base_price, compare_at_price, default_variant_size, primary_image_url, description, is_best_seller, is_new, is_featured, rating, review_count, available_quantity, allow_backorder')
        .order('created_at', { ascending: false })
        .range(page * CATALOG_PAGE_SIZE, (page + 1) * CATALOG_PAGE_SIZE - 1);

      if (error) throw new Error(`Failed to load storefront catalog: ${error.message}`);
      return (data ?? []).map((row) => {
        const product = rowToStorefrontProduct(row);
        const imageUrl = getCatalogImageUrl(row.slug, row.primary_image_url);
        product.image = imageUrl;
        product.gallery = imageUrl ? [imageUrl] : [];
        return product;
      });
    },
    ['storefront-catalog-page-v2', String(CATALOG_PAGE_SIZE), String(page)],
    { tags: ['storefront-catalog'], revalidate: 60 },
  );
}

/** All published products for storefront listing, search, and home sections. */
export async function fetchStorefrontCatalog(): Promise<StorefrontProduct[]> {
  const firstPage = await getCachedStorefrontCatalogPage(0)();
  if (firstPage.length < CATALOG_PAGE_SIZE) return firstPage;

  const products: StorefrontProduct[] = [...firstPage];

  // Fetch bounded batches in parallel, stopping once a short page marks the
  // end of the catalog. Do not request later pages unless the first page is
  // full; small catalogs otherwise issue several expensive, guaranteed-empty
  // view queries during every cache refresh.
  for (let firstPageIndex = 1; ; firstPageIndex += CATALOG_CACHE_BATCH_SIZE) {
    const pages = await Promise.all(
      Array.from({ length: CATALOG_CACHE_BATCH_SIZE }, (_, offset) =>
        getCachedStorefrontCatalogPage(firstPageIndex + offset)(),
      ),
    );

    let reachedEnd = false;
    for (const page of pages) {
      products.push(...page);
      if (page.length < CATALOG_PAGE_SIZE) {
        reachedEnd = true;
        break;
      }
    }

    if (reachedEnd) return products;
  }
}

const getCachedFeaturedCategories = unstable_cache(
  async (): Promise<Category[]> => new CategoryRepository(createPublicClient()).findFeatured(),
  ['storefront-featured-categories-v1'],
  { tags: ['storefront-categories'], revalidate: 300 },
);

export async function fetchFeaturedCategories(): Promise<Category[]> {
  return getCachedFeaturedCategories();
}

const getCachedActiveCategories = unstable_cache(
  async (): Promise<Category[]> => new CategoryRepository(createPublicClient()).findAll(),
  ['storefront-active-categories-v1'],
  { tags: ['storefront-categories'], revalidate: 300 },
);

export async function fetchActiveCategories(): Promise<Category[]> {
  return getCachedActiveCategories();
}

const getCachedPublicUgcVideos = unstable_cache(
  async (): Promise<PublicUgcVideo[]> => new UgcVideoRepository(createPublicClient()).findVisible(),
  ['storefront-ugc-videos-v1'],
  { tags: ['storefront-ugc-videos'], revalidate: 300 },
);

export async function fetchPublicUgcVideos(): Promise<PublicUgcVideo[]> {
  return getCachedPublicUgcVideos();
}

const getCachedPublicFeedback = unstable_cache(
  async (): Promise<CustomerFeedbackImage[]> => new CustomerFeedbackRepository(createPublicClient()).findVisible(),
  ['storefront-customer-feedback-v1'],
  { tags: ['storefront-customer-feedback'], revalidate: 300 },
);

export async function fetchPublicCustomerFeedback(): Promise<CustomerFeedbackImage[]> {
  return getCachedPublicFeedback();
}

/** Full product detail by URL slug, shared across requests and invalidated with catalog mutations. */
const getCachedProductBySlug = unstable_cache(
  async (slug: string): Promise<StorefrontProduct | null> => {
    try {
      const supabase = createPublicClient();
      const product = await new ProductRepository(supabase).findBySlug(slug);
      const storefrontProduct = domainToStorefrontProduct(product);
      storefrontProduct.gallery = product.images.map((image, index) =>
        getCatalogImageUrl(slug, image.url, index),
      );
      storefrontProduct.image = storefrontProduct.gallery[0] ?? '';
      return storefrontProduct;
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  },
  ['storefront-product-detail-v1'],
  { tags: ['storefront-catalog'], revalidate: 60 },
);

export const fetchProductBySlug = cache((slug: string): Promise<StorefrontProduct | null> =>
  getCachedProductBySlug(slug),
);

/** All published slugs for static generation. */
export async function fetchPublishedSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  return new ProductRepository(supabase).findAllSlugs();
}
