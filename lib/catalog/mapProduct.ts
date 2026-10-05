import type { Product as StorefrontProduct } from '@/lib/data/products';
import type { Product as DomainProduct, ProductSummary } from '@/src/types/domain';
import type { StorefrontProductRow } from '@/src/types/database';

/** Map a storefront view row to the legacy UI Product shape (slug as id). */
export function rowToStorefrontProduct(row: StorefrontProductRow): StorefrontProduct {
  return {
    id: row.slug,
    name: row.name,
    subtitle: row.subtitle ?? '',
    category: row.category_slug ?? '',
    price: Number(row.default_variant_price ?? row.base_price),
    originalPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    size: row.default_variant_size ?? '50ml',
    image: row.primary_image_url ?? '',
    gallery: row.primary_image_url ? [row.primary_image_url] : [],
    // Notes/tags are loaded on the product detail page; listing uses summaries only.
    description: row.description ?? '',
    longDescription: row.long_description ?? '',
    notes: { top: [], heart: [], base: [] },
    ingredients: row.ingredients ?? '',
    isBestSeller: row.is_best_seller,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    inStock: row.available_quantity > 0 || row.allow_backorder,
    tags: [],
  };
}

export function summaryToStorefrontProduct(s: ProductSummary): StorefrontProduct {
  return {
    id: s.slug,
    name: s.name,
    subtitle: s.subtitle ?? '',
    category: s.categorySlug ?? '',
    price: s.defaultVariantPrice ?? s.basePrice,
    originalPrice: s.compareAtPrice ?? undefined,
    size: s.defaultVariantSize ?? '50ml',
    image: s.primaryImageUrl ?? '',
    gallery: s.primaryImageUrl ? [s.primaryImageUrl] : [],
    description: '',
    longDescription: '',
    notes: { top: [], heart: [], base: [] },
    ingredients: '',
    isBestSeller: s.isBestSeller,
    isNew: s.isNew,
    isFeatured: s.isFeatured,
    rating: s.rating,
    reviewCount: s.reviewCount,
    inStock: s.availableQuantity > 0 || s.allowBackorder,
    tags: [],
  };
}

export function domainToStorefrontProduct(p: DomainProduct): StorefrontProduct {
  const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
  return {
    id: p.slug,
    name: p.name,
    subtitle: p.subtitle ?? '',
    category: p.category.slug,
    price: defaultVariant?.price ?? p.basePrice,
    originalPrice: p.compareAtPrice ?? undefined,
    size: defaultVariant?.size ?? '50ml',
    image: p.images[0]?.url ?? '',
    gallery: p.images.map((i) => i.url),
    description: p.description ?? '',
    longDescription: p.longDescription ?? '',
    notes: p.fragranceNotes,
    ingredients: p.ingredients ?? '',
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock:
      (defaultVariant?.availableQuantity ?? 0) > 0 ||
      (defaultVariant?.allowBackorder ?? false),
    tags: p.tags.map((t) => t.slug),
  };
}
