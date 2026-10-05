import { createServerClient } from '@/src/lib/supabase/server';
import { ProductRepository } from '@/src/repositories/product.repository';
import type { Product as StorefrontProduct } from '@/lib/data/products';
import { domainToStorefrontProduct, rowToStorefrontProduct } from './mapProduct';

/** All published products for storefront listing, search, and home sections. */
export async function fetchStorefrontCatalog(): Promise<StorefrontProduct[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load storefront catalog: ${error.message}`);
  }

  return (data ?? []).map(rowToStorefrontProduct);
}

/** Full product detail by URL slug. */
export async function fetchProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  try {
    const supabase = await createServerClient();
    const product = await new ProductRepository(supabase).findBySlug(slug);
    return domainToStorefrontProduct(product);
  } catch {
    return null;
  }
}

/** All published slugs for static generation. */
export async function fetchPublishedSlugs(): Promise<string[]> {
  const supabase = await createServerClient();
  return new ProductRepository(supabase).findAllSlugs();
}
