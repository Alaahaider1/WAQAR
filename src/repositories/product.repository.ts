/**
 * Product repository.
 *
 * All database reads and writes for products, variants, images,
 * fragrance notes, and tags.
 *
 * Uses the storefront_products view for listing queries (fast, denormalized)
 * and joins individual tables for full product detail and admin CRUD.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type {
  Product,
  ProductSummary,
  ProductVariant,
  ProductImage,
  FragranceNotes,
  Tag,
  Category,
  ProductFilters,
  PaginationParams,
  PaginatedResult,
} from '@/src/types/domain';
import type {
  ProductRow,
  ProductVariantRow,
  ProductImageRow,
  FragranceNoteRow,
  CategoryRow,
  StorefrontProductRow,
  ProductStatus,
} from '@/src/types/database';
import type { ProductInput, UpdateProductInput } from '@/src/validations';

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    position: row.position,
    isActive: row.is_active,
    isFeatured: Boolean(row.is_featured),
  };
}

function mapVariant(
  row: ProductVariantRow,
  inventory?: { available_quantity: number; allow_backorder: boolean }
): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    size: row.size,
    concentration: row.concentration,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    isDefault: row.is_default,
    isActive: row.is_active,
    availableQuantity: inventory?.available_quantity ?? 0,
    allowBackorder: inventory?.allow_backorder ?? false,
  };
}

function mapImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    url: row.url,
    altText: row.alt_text,
    position: row.position,
    cloudinaryId: row.cloudinary_id,
  };
}

function mapFragranceNotes(rows: FragranceNoteRow[]): FragranceNotes {
  return {
    top: rows.filter((r) => r.type === 'top').sort((a, b) => a.position - b.position).map((r) => r.name),
    heart: rows.filter((r) => r.type === 'heart').sort((a, b) => a.position - b.position).map((r) => r.name),
    base: rows.filter((r) => r.type === 'base').sort((a, b) => a.position - b.position).map((r) => r.name),
  };
}

function mapStorefrontRow(row: StorefrontProductRow): ProductSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    basePrice: Number(row.base_price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    primaryImageUrl: row.primary_image_url,
    primaryImageAlt: row.primary_image_alt,
    defaultVariantId: row.default_variant_id,
    defaultVariantSize: row.default_variant_size,
    defaultVariantPrice: row.default_variant_price != null ? Number(row.default_variant_price) : null,
    isBestSeller: row.is_best_seller,
    isNew: row.is_new,
    isFeatured: row.is_featured,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    availableQuantity: row.available_quantity,
    allowBackorder: row.allow_backorder,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class ProductRepository extends BaseRepository {

  // ── Storefront reads (use view) ──────────────────────────────────────────

  async findAll(
    filters: ProductFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<ProductSummary>> {
    const { from, to } = this.toRange(pagination);

    let query = this.db
      .from('storefront_products')
      .select('*', { count: 'exact' });

    if (filters.categorySlug) {
      query = query.eq('category_slug', filters.categorySlug);
    }
    if (filters.isBestSeller !== undefined) {
      query = query.eq('is_best_seller', filters.isBestSeller);
    }
    if (filters.isNew !== undefined) {
      query = query.eq('is_new', filters.isNew);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('default_variant_price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('default_variant_price', filters.maxPrice);
    }
    if (filters.search) {
      // Uses the GIN FTS index on the underlying products table
      query = query.textSearch('name', filters.search, {
        type: 'websearch',
        config: 'english',
      });
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'ProductRepository.findAll');

    return this.paginate(
      (data ?? []).map(mapStorefrontRow),
      count ?? 0,
      pagination
    );
  }

  async findBestSellers(limit = 6): Promise<ProductSummary[]> {
    const { data, error } = await this.db
      .from('storefront_products')
      .select('*')
      .eq('is_best_seller', true)
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) throw toWaqarError(error, 'ProductRepository.findBestSellers');
    return (data ?? []).map(mapStorefrontRow);
  }

  async findNewArrivals(limit = 4): Promise<ProductSummary[]> {
    const { data, error } = await this.db
      .from('storefront_products')
      .select('*')
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw toWaqarError(error, 'ProductRepository.findNewArrivals');
    return (data ?? []).map(mapStorefrontRow);
  }

  async findFeatured(limit = 6): Promise<ProductSummary[]> {
    const { data, error } = await this.db
      .from('storefront_products')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw toWaqarError(error, 'ProductRepository.findFeatured');
    return (data ?? []).map(mapStorefrontRow);
  }

  async findByCategory(
    categorySlug: string,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<ProductSummary>> {
    return this.findAll({ categorySlug }, pagination);
  }

  // ── Full product detail (for PDP) ────────────────────────────────────────

  async findBySlug(slug: string): Promise<Product> {
    // Fetch product + category in one query
    const { data: productData, error: productError } = await this.db
      .from('products')
      .select(`
        id, slug, name, subtitle, description, long_description, ingredients,
        base_price, compare_at_price, status, is_best_seller, is_new, is_featured,
        rating, review_count, seo_title, seo_description, created_at, updated_at,
        categories (id, slug, name, description, image_url, position, is_active, is_featured)
      `)
      .eq('slug', slug)
      .eq('status', 'published' as ProductStatus)
      .is('deleted_at', null)
      .single();

    if (productError) throw toWaqarError(productError, 'ProductRepository.findBySlug');
    if (!productData) {
      throw new NotFoundError('Product', slug);
    }

    return this.assembleProduct(productData);
  }

  async findById(id: string): Promise<Product> {
    const { data, error } = await this.db
      .from('products')
      .select(`*, categories (*)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundError('Product', id);
    return this.assembleProduct(data);
  }

  /** Fetches all published slugs — used by generateStaticParams */
  async findAllSlugs(): Promise<string[]> {
    const { data, error } = await this.db
      .from('products')
      .select('slug')
      .eq('status', 'published' as ProductStatus)
      .is('deleted_at', null);

    if (error) throw toWaqarError(error, 'ProductRepository.findAllSlugs');
    return (data ?? []).map((r) => r.slug);
  }

  // ── Admin reads (all statuses) ───────────────────────────────────────────

  async findAllAdmin(
    filters: Partial<{ status: ProductStatus; search: string; categoryId: string }> = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<ProductSummary>> {
    const { from, to } = this.toRange(pagination);

    // Admin view — RLS already ensures only admins can call this
    // The view filters to published only, so admin needs the raw products table
    // We re-query products table directly for admin
    let adminQuery = this.db
      .from('products')
      .select(`
        id, slug, name, subtitle, base_price, compare_at_price,
        status, is_best_seller, is_new, is_featured, rating, review_count,
        created_at, categories!inner(id, slug, name),
        product_images(url, alt_text, position),
        product_variants(id, sku, size, price, is_default, is_active)
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (filters.status) adminQuery = adminQuery.eq('status', filters.status);
    if (filters.categoryId) adminQuery = adminQuery.eq('category_id', filters.categoryId);

    const { data, error, count } = await adminQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'ProductRepository.findAllAdmin');

    // Map to ProductSummary shape
    const rows = ((data ?? []) as unknown) as Array<Record<string, unknown> & {
      categories?: Array<Record<string, unknown>> | Record<string, unknown> | null;
      product_images?: Array<Record<string, unknown>>;
      product_variants?: Array<Record<string, unknown>>;
    }>;
    const summaries: ProductSummary[] = rows.map((row) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      const primaryImage = (row.product_images ?? []).find((img) => Number(img.position ?? 0) === 0);
      const defaultVariant = (row.product_variants ?? []).find((v) => v.is_default === true) ?? row.product_variants?.[0];

      return {
        id: String(row.id ?? ''),
        slug: String(row.slug ?? ''),
        name: String(row.name ?? ''),
        subtitle: row.subtitle != null ? String(row.subtitle) : null,
        categorySlug: cat?.slug != null ? String(cat.slug) : '',
        categoryName: cat?.name != null ? String(cat.name) : '',
        basePrice: Number(row.base_price ?? 0),
        compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
        primaryImageUrl: primaryImage?.url != null ? String(primaryImage.url) : null,
        primaryImageAlt: primaryImage?.alt_text != null ? String(primaryImage.alt_text) : null,
        defaultVariantId: defaultVariant?.id != null ? String(defaultVariant.id) : null,
        defaultVariantSize: defaultVariant?.size != null ? String(defaultVariant.size) : null,
        defaultVariantPrice: defaultVariant?.price != null ? Number(defaultVariant.price) : null,
        isBestSeller: Boolean(row.is_best_seller),
        isNew: Boolean(row.is_new),
        isFeatured: Boolean(row.is_featured),
        rating: Number(row.rating ?? 0),
        reviewCount: Number(row.review_count ?? 0),
        availableQuantity: 0, // populated separately for admin views
        allowBackorder: false,
      };
    });

    return this.paginate(summaries, count ?? 0, pagination);
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  async create(input: ProductInput): Promise<Product> {
    const { variants, images, fragranceNotes, tagIds, ...productFields } = input;

    // 1. Insert product
    const { data: product, error: productError } = await this.db
      .from('products')
      .insert({
        name: productFields.name,
        ...(productFields.slug && { slug: productFields.slug }),
        subtitle: productFields.subtitle ?? null,
        category_id: productFields.categoryId,
        description: productFields.description ?? null,
        long_description: productFields.longDescription ?? null,
        ingredients: productFields.ingredients ?? null,
        base_price: productFields.basePrice,
        compare_at_price: productFields.compareAtPrice ?? null,
        status: productFields.status,
        is_best_seller: productFields.isBestSeller ?? false,
        is_new: productFields.isNew ?? false,
        is_featured: productFields.isFeatured ?? false,
        seo_title: productFields.seoTitle ?? null,
        seo_description: productFields.seoDescription ?? null,
      })
      .select()
      .single();

    if (productError || !product) throw toWaqarError(productError, 'ProductRepository.create - product');

    const productId = product.id;

    // 2. Insert variants
    if (variants.length > 0) {
      const { data: insertedVariants, error: variantError } = await this.anyDb
        .from('product_variants')
        .insert(
          variants.map((v, idx) => ({
            product_id: productId,
            sku: v.sku,
            size: v.size,
            concentration: v.concentration ?? null,
            price: v.price,
            compare_at_price: v.compareAtPrice ?? null,
            is_default: v.isDefault ?? idx === 0,
            position: v.position ?? idx,
            is_active: v.isActive ?? true,
          }))
        )
        .select('id, is_default');

      if (variantError) throw toWaqarError(variantError, 'ProductRepository.create - variants');

      for (const variant of insertedVariants ?? []) {
        await this.upsertInventory(variant.id, 0);
      }
    }

    // 3. Insert images
    if (images && images.length > 0) {
      const { error: imageError } = await this.anyDb.from('product_images').insert(
        images.map((img, idx) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.altText ?? null,
          position: img.position ?? idx,
          cloudinary_id: img.cloudinaryId ?? null,
        }))
      );
      if (imageError) throw toWaqarError(imageError, 'ProductRepository.create - images');
    }

    // 4. Insert fragrance notes
    if (fragranceNotes && fragranceNotes.length > 0) {
      const { error: notesError } = await this.anyDb.from('fragrance_notes').insert(
        fragranceNotes.map((note, idx) => ({
          product_id: productId,
          type: note.type,
          name: note.name,
          position: note.position ?? idx,
        }))
      );
      if (notesError) throw toWaqarError(notesError, 'ProductRepository.create - notes');
    }

    // 5. Insert tag associations
    if (tagIds && tagIds.length > 0) {
      const { error: tagsError } = await this.anyDb.from('product_tags').insert(
        tagIds.map((tag_id) => ({ product_id: productId, tag_id }))
      );
      if (tagsError) throw toWaqarError(tagsError, 'ProductRepository.create - tags');
    }

    return this.findById(productId);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const { variants, images, fragranceNotes, tagIds, ...productFields } = input;

    // 1. Update product core fields
    if (Object.keys(productFields).length > 0) {
      const updateData: Record<string, unknown> = {};
      if (productFields.name !== undefined) updateData.name = productFields.name;
      if (productFields.slug !== undefined) updateData.slug = productFields.slug;
      if (productFields.subtitle !== undefined) updateData.subtitle = productFields.subtitle;
      if (productFields.categoryId !== undefined) updateData.category_id = productFields.categoryId;
      if (productFields.description !== undefined) updateData.description = productFields.description;
      if (productFields.longDescription !== undefined) updateData.long_description = productFields.longDescription;
      if (productFields.ingredients !== undefined) updateData.ingredients = productFields.ingredients;
      if (productFields.basePrice !== undefined) updateData.base_price = productFields.basePrice;
      if (productFields.compareAtPrice !== undefined) updateData.compare_at_price = productFields.compareAtPrice;
      if (productFields.status !== undefined) updateData.status = productFields.status;
      if (productFields.isBestSeller !== undefined) updateData.is_best_seller = productFields.isBestSeller;
      if (productFields.isNew !== undefined) updateData.is_new = productFields.isNew;
      if (productFields.isFeatured !== undefined) updateData.is_featured = productFields.isFeatured;
      if (productFields.seoTitle !== undefined) updateData.seo_title = productFields.seoTitle;
      if (productFields.seoDescription !== undefined) updateData.seo_description = productFields.seoDescription;

      const { error } = await this.anyDb.from('products').update(updateData).eq('id', id);
      if (error) throw toWaqarError(error, 'ProductRepository.update - product');
    }

    // 2. Replace or update variants if provided
    if (variants !== undefined && variants.length > 0) {
      const defaultVariantInput = variants.find((v) => v.isDefault) ?? variants[0];
      const { data: existingDefault } = await this.anyDb
        .from('product_variants')
        .select('id')
        .eq('product_id', id)
        .eq('is_default', true)
        .maybeSingle();

      if (existingDefault) {
        const { error: variantError } = await this.anyDb
          .from('product_variants')
          .update({
            sku: defaultVariantInput.sku,
            size: defaultVariantInput.size,
            concentration: defaultVariantInput.concentration ?? null,
            price: defaultVariantInput.price,
            compare_at_price: defaultVariantInput.compareAtPrice ?? null,
            is_active: defaultVariantInput.isActive ?? true,
          })
          .eq('id', existingDefault.id);

        if (variantError) throw toWaqarError(variantError, 'ProductRepository.update - variants');
      } else {
        const { data: inserted, error: insertError } = await this.anyDb
          .from('product_variants')
          .insert({
            product_id: id,
            sku: defaultVariantInput.sku,
            size: defaultVariantInput.size,
            concentration: defaultVariantInput.concentration ?? null,
            price: defaultVariantInput.price,
            compare_at_price: defaultVariantInput.compareAtPrice ?? null,
            is_default: true,
            position: 0,
            is_active: defaultVariantInput.isActive ?? true,
          })
          .select('id')
          .single();

        if (insertError || !inserted) {
          throw toWaqarError(insertError, 'ProductRepository.update - variants insert');
        }
        await this.upsertInventory(inserted.id, 0);
      }
    }
    if (images !== undefined) {
      await this.anyDb.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        await this.anyDb.from('product_images').insert(
          images.map((img, idx) => ({
            product_id: id,
            url: img.url,
            alt_text: img.altText ?? null,
            position: img.position ?? idx,
            cloudinary_id: img.cloudinaryId ?? null,
          }))
        );
      }
    }

    // 3. Replace fragrance notes if provided
    if (fragranceNotes !== undefined) {
      await this.anyDb.from('fragrance_notes').delete().eq('product_id', id);
      if (fragranceNotes.length > 0) {
        await this.anyDb.from('fragrance_notes').insert(
          fragranceNotes.map((note, idx) => ({
            product_id: id,
            type: note.type,
            name: note.name,
            position: note.position ?? idx,
          }))
        );
      }
    }

    // 4. Replace tags if provided
    if (tagIds !== undefined) {
      await this.anyDb.from('product_tags').delete().eq('product_id', id);
      if (tagIds.length > 0) {
        await this.anyDb.from('product_tags').insert(
          tagIds.map((tag_id) => ({ product_id: id, tag_id }))
        );
      }
    }

    return this.findById(id);
  }

  async upsertInventory(
    variantId: string,
    stockQuantity: number,
    allowBackorder = false
  ): Promise<void> {
    const { error } = await this.anyDb.from('inventory').upsert(
      {
        variant_id: variantId,
        stock_quantity: Math.max(0, stockQuantity),
        reserved_quantity: 0,
        reorder_threshold: 10,
        allow_backorder: allowBackorder,
      },
      { onConflict: 'variant_id' }
    );

    if (error) throw toWaqarError(error, 'ProductRepository.upsertInventory');
  }

  /** Soft delete — sets deleted_at, never removes from DB */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'ProductRepository.softDelete');
  }

  async updateStatus(id: string, status: ProductStatus): Promise<void> {
    const { error } = await this.db
      .from('products')
      .update({ status })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'ProductRepository.updateStatus');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async assembleProduct(data: unknown): Promise<Product> {
    const row = data as Record<string, unknown> & {
      categories?: Array<Record<string, unknown>> | Record<string, unknown> | null;
      id?: string;
      slug?: string;
      name?: string;
      subtitle?: string | null;
      description?: string | null;
      long_description?: string | null;
      ingredients?: string | null;
      base_price?: number;
      compare_at_price?: number | null;
      status?: ProductStatus;
      is_best_seller?: boolean;
      is_new?: boolean;
      is_featured?: boolean;
      rating?: number;
      review_count?: number;
      seo_title?: string | null;
      seo_description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    const productId = row.id ?? '';

    // These related collections are independent; fetch them concurrently.
    const [variantResult, imageResult, noteResult, tagResult] = await Promise.all([
      this.db.from('product_variants')
        .select('id, product_id, sku, size, concentration, price, compare_at_price, is_default, is_active, position, inventory(stock_quantity, reserved_quantity, allow_backorder)')
        .eq('product_id', productId).eq('is_active', true).order('position'),
      this.db.from('product_images')
        .select('id, product_id, url, alt_text, position, cloudinary_id, created_at')
        .eq('product_id', productId).order('position'),
      this.db.from('fragrance_notes')
        .select('id, product_id, type, name, position, created_at')
        .eq('product_id', productId).order('position'),
      this.db.from('product_tags')
        .select('tags(id, slug, name)')
        .eq('product_id', productId),
    ]);
    const variantData = variantResult.data;
    const imageData = imageResult.data;
    const noteData = noteResult.data;
    const tagData = tagResult.data;
    if (variantResult.error) throw toWaqarError(variantResult.error, 'ProductRepository.assembleProduct.variants');
    if (imageResult.error) throw toWaqarError(imageResult.error, 'ProductRepository.assembleProduct.images');
    if (noteResult.error) throw toWaqarError(noteResult.error, 'ProductRepository.assembleProduct.notes');
    if (tagResult.error) throw toWaqarError(tagResult.error, 'ProductRepository.assembleProduct.tags');

    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;

    const variants: ProductVariant[] = ((variantData ?? []) as unknown as Array<Record<string, unknown> & {
      inventory?: Record<string, unknown> | Array<Record<string, unknown>> | null;
    }>).map((v) => {
      const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
      const available = inv
        ? Math.max(0, Number(inv.stock_quantity ?? 0) - Number(inv.reserved_quantity ?? 0))
        : 0;
      return mapVariant(v as ProductVariantRow, { available_quantity: available, allow_backorder: Boolean(inv?.allow_backorder ?? false) });
    });

    const tags: Tag[] = (((tagData ?? []) as unknown) as Array<Record<string, unknown> & {
      tags?: Record<string, unknown> | Array<Record<string, unknown>> | null;
    }>).map((pt) => {
      const tag = Array.isArray(pt.tags) ? pt.tags[0] : pt.tags;
      return tag ? { id: String(tag.id ?? ''), slug: String(tag.slug ?? ''), name: String(tag.name ?? '') } : null;
    }).filter(Boolean) as Tag[];

    return {
      id: row.id ?? '',
      slug: row.slug ?? '',
      name: row.name ?? '',
      subtitle: row.subtitle ?? null,
      category: mapCategory(category as CategoryRow),
      description: row.description ?? null,
      longDescription: row.long_description ?? null,
      ingredients: row.ingredients ?? null,
      basePrice: Number(row.base_price ?? 0),
      compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : null,
      status: (row.status ?? 'draft') as ProductStatus,
      isBestSeller: Boolean(row.is_best_seller),
      isNew: Boolean(row.is_new),
      isFeatured: Boolean(row.is_featured),
      rating: Number(row.rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
      variants,
      images: (imageData ?? []).map(mapImage),
      fragranceNotes: mapFragranceNotes(noteData ?? []),
      tags,
      createdAt: row.created_at ?? '',
      updatedAt: row.updated_at ?? '',
    };
  }
}
