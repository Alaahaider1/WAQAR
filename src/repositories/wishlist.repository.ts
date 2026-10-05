/**
 * Wishlist repository.
 * One wishlist per user, auto-created by DB trigger on profile creation.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { WishlistItem, ProductSummary } from '@/src/types/domain';

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class WishlistRepository extends BaseRepository {

  /** Get or create the wishlist id for a user */
  private async getWishlistId(userId: string): Promise<string> {
    // The trigger creates it on signup; this handles the edge case where it doesn't exist
    const { data, error } = await this.db
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .single();

    let wishlist: { id: string } | null = data;

    if (error || !wishlist) {
      const insert = await this.db
        .from('wishlists')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (insert.error || !insert.data) {
        throw toWaqarError(insert.error, 'WishlistRepository.getWishlistId');
      }
      wishlist = insert.data;
    }

    return wishlist.id;
  }

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    const wishlistId = await this.getWishlistId(userId);

    const { data, error } = await this.db
      .from('wishlist_items')
      .select(`
        id,
        created_at,
        products (
          id, slug, name, subtitle, base_price, compare_at_price,
          is_best_seller, is_new, rating, review_count,
          categories (id, slug, name),
          product_images (url, alt_text, position),
          product_variants (id, sku, size, price, is_default)
        )
      `)
      .eq('wishlist_id', wishlistId)
      .order('created_at', { ascending: false });

    if (error) throw toWaqarError(error, 'WishlistRepository.findByUserId');

    return (data ?? []).map((row: Record<string, unknown>): WishlistItem => {
      const productData = row.products;
      const productRecord = (Array.isArray(productData) ? productData[0] : productData) as Record<string, unknown> | null | undefined;
      const categoryData = productRecord?.categories;
      const categories = Array.isArray(categoryData) ? categoryData[0] : categoryData;
      const cat = categories as Record<string, unknown> | null | undefined;
      const productImages = Array.isArray(productRecord?.product_images) ? productRecord?.product_images as Array<Record<string, unknown>> : [];
      const productVariants = Array.isArray(productRecord?.product_variants) ? productRecord?.product_variants as Array<Record<string, unknown>> : [];
      const img = productImages.find((item) => Number(item.position ?? 0) === 0);
      const variant = productVariants.find((item) => item.is_default === true) ?? productVariants[0];

      const product: ProductSummary = {
        id: String(productRecord?.id ?? ''),
        slug: String(productRecord?.slug ?? ''),
        name: String(productRecord?.name ?? ''),
        subtitle: productRecord?.subtitle != null ? String(productRecord.subtitle) : null,
        categorySlug: String(cat?.slug ?? ''),
        categoryName: String(cat?.name ?? ''),
        basePrice: Number(productRecord?.base_price ?? 0),
        compareAtPrice: productRecord?.compare_at_price != null ? Number(productRecord.compare_at_price) : null,
        primaryImageUrl: img?.url != null ? String(img.url) : null,
        primaryImageAlt: img?.alt_text != null ? String(img.alt_text) : null,
        defaultVariantId: variant?.id != null ? String(variant.id) : null,
        defaultVariantSize: variant?.size != null ? String(variant.size) : null,
        defaultVariantPrice: variant?.price != null ? Number(variant.price) : null,
        isBestSeller: Boolean(productRecord?.is_best_seller ?? false),
        isNew: Boolean(productRecord?.is_new ?? false),
        isFeatured: false,
        rating: Number(productRecord?.rating ?? 0),
        reviewCount: Number(productRecord?.review_count ?? 0),
        availableQuantity: 0,
        allowBackorder: false,
      };

      return { id: String(row.id ?? ''), productId: String(productRecord?.id ?? ''), product, addedAt: String(row.created_at ?? '') };
    });
  }

  async addItem(userId: string, productId: string): Promise<void> {
    const wishlistId = await this.getWishlistId(userId);

    const { error } = await this.db
      .from('wishlist_items')
      .insert({ wishlist_id: wishlistId, product_id: productId });

    // Ignore duplicate — already in wishlist
    if (error && (error as { code?: string }).code !== '23505') {
      throw toWaqarError(error, 'WishlistRepository.addItem');
    }
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    const wishlistId = await this.getWishlistId(userId);

    const { error } = await this.db
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlistId)
      .eq('product_id', productId);

    if (error) throw toWaqarError(error, 'WishlistRepository.removeItem');
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlistId = await this.getWishlistId(userId);

    const { data } = await this.db
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('product_id', productId)
      .single();

    return !!data;
  }

  async clear(userId: string): Promise<void> {
    const wishlistId = await this.getWishlistId(userId);

    const { error } = await this.db
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlistId);

    if (error) throw toWaqarError(error, 'WishlistRepository.clear');
  }
}
