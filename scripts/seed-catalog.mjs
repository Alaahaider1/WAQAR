#!/usr/bin/env node
/**
 * WAQAR — Catalog Seed Script
 *
 * Seeds categories, products, variants, images, fragrance notes, tags, and inventory
 * from scripts/catalog-seed.json (generated from lib/data/products.ts).
 *
 * Run after schema migration:
 *   node scripts/seed-catalog.mjs
 *
 * Safe to re-run — skips existing slugs.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* rely on process.env */
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CATEGORIES = [
  { slug: 'summer', name: 'Summer Collection', position: 0 },
  { slug: 'winter', name: 'Winter Collection', position: 1 },
  { slug: 'bundle', name: 'Gift Sets & Bundles', position: 2 },
];

function mapCategory(cat) {
  if (cat === 'bestseller' || cat === 'new') return 'summer';
  return cat;
}

function skuFor(slug, size) {
  const base = slug.toUpperCase().replace(/-/g, '').slice(0, 10);
  const sizePart = size.replace(/\s+/g, '').replace(/×/g, 'x').slice(0, 8);
  return `WQ-${base}-${sizePart}`;
}

function stockFor(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return 20 + (Math.abs(hash) % 80);
}

async function ensureCategories() {
  const map = {};
  for (const cat of CATEGORIES) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', cat.slug)
      .maybeSingle();

    if (existing) {
      map[cat.slug] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...cat, is_active: true })
      .select('id, slug')
      .single();

    if (error) throw new Error(`Category ${cat.slug}: ${error.message}`);
    map[cat.slug] = data.id;
  }
  return map;
}

async function ensureTag(slug, cache) {
  if (cache[slug]) return cache[slug];
  const { data: existing } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    cache[slug] = existing.id;
    return existing.id;
  }
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const { data, error } = await supabase.from('tags').insert({ slug, name }).select('id').single();
  if (error) throw new Error(`Tag ${slug}: ${error.message}`);
  cache[slug] = data.id;
  return data.id;
}

async function seedProduct(p, categoryIds, tagCache) {
  const { data: existing } = await supabase
    .from('products')
    .select('id, slug')
    .eq('slug', p.id)
    .maybeSingle();

  if (existing) {
    console.log(`  · skip ${p.id} (exists)`);
    return;
  }

  const categorySlug = mapCategory(p.category);
  const categoryId = categoryIds[categorySlug];
  if (!categoryId) throw new Error(`Unknown category: ${p.category}`);

  const compareAt =
    p.originalPrice && p.originalPrice > p.price ? p.originalPrice : null;

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      slug: p.id,
      name: p.name,
      subtitle: p.subtitle,
      category_id: categoryId,
      description: p.description,
      long_description: p.longDescription,
      ingredients: p.ingredients,
      base_price: p.price,
      compare_at_price: compareAt,
      status: 'published',
      is_best_seller: !!p.isBestSeller,
      is_new: !!p.isNew,
      is_featured: !!p.isFeatured,
      rating: p.rating,
      review_count: p.reviewCount,
    })
    .select('id')
    .single();

  if (productError || !product) {
    throw new Error(`Product ${p.id}: ${productError?.message}`);
  }

  const productId = product.id;
  const sku = skuFor(p.id, p.size);

  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      size: p.size,
      price: p.price,
      compare_at_price: compareAt,
      is_default: true,
      position: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (variantError || !variant) {
    throw new Error(`Variant ${p.id}: ${variantError?.message}`);
  }

  const stock = stockFor(p.id);
  const { error: invError } = await supabase.from('inventory').upsert(
    {
      variant_id: variant.id,
      stock_quantity: p.inStock ? stock : 0,
      reserved_quantity: 0,
      reorder_threshold: 10,
      allow_backorder: false,
    },
    { onConflict: 'variant_id' }
  );
  if (invError) throw new Error(`Inventory ${p.id}: ${invError.message}`);

  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const { error: imagesError } = await supabase.from('product_images').insert(
    gallery.map((url, idx) => ({
      product_id: productId,
      url,
      alt_text: idx === 0 ? p.name : null,
      position: idx,
    }))
  );
  if (imagesError) throw new Error(`Images ${p.id}: ${imagesError.message}`);

  const noteRows = [];
  for (const [type, names] of [
    ['top', p.notes.top],
    ['heart', p.notes.heart],
    ['base', p.notes.base],
  ]) {
    names.forEach((name, position) => {
      noteRows.push({ product_id: productId, type, name, position });
    });
  }
  if (noteRows.length) {
    const { error: notesError } = await supabase.from('fragrance_notes').insert(noteRows);
    if (notesError) throw new Error(`Notes ${p.id}: ${notesError.message}`);
  }

  if (p.tags?.length) {
    const tagLinks = [];
    for (const tagSlug of p.tags) {
      const tagId = await ensureTag(tagSlug, tagCache);
      tagLinks.push({ product_id: productId, tag_id: tagId });
    }
    const { error: tagsError } = await supabase.from('product_tags').insert(tagLinks);
    if (tagsError) throw new Error(`Tags ${p.id}: ${tagsError.message}`);
  }

  console.log(`  ✓ ${p.id}`);
}

async function main() {
  console.log('\n── WAQAR Catalog Seed ─────────────────────────────\n');

  const seedPath = resolve(process.cwd(), 'scripts/catalog-seed.json');
  const products = JSON.parse(readFileSync(seedPath, 'utf8'));

  console.log('Ensuring categories…');
  const categoryIds = await ensureCategories();
  console.log('✓ Categories ready\n');

  console.log(`Seeding ${products.length} products…`);
  const tagCache = {};
  for (const p of products) {
    await seedProduct(p, categoryIds, tagCache);
  }

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  console.log(`\n✅ Done — ${count ?? 0} products in database\n`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
