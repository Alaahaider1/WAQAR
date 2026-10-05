-- Keep large inline product images out of storefront REST responses while
-- preserving the existing image endpoint and SHA-256 URL version format.
create or replace view public.storefront_products
  with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.subtitle,
  p.description,
  p.long_description,
  p.ingredients,
  p.base_price,
  p.compare_at_price,
  p.is_best_seller,
  p.is_new,
  p.is_featured,
  p.rating,
  p.review_count,
  p.created_at,

  c.id          as category_id,
  c.slug        as category_slug,
  c.name        as category_name,

  case
    when img.url like 'data:image/%' then
      '/api/storefront/product-image/' || p.slug || '/' ||
      substring(encode(extensions.digest(convert_to(img.url, 'UTF8'), 'sha256'::text), 'hex') from 1 for 20) || '/0'
    else img.url
  end           as primary_image_url,
  img.alt_text  as primary_image_alt,

  v.id          as default_variant_id,
  v.sku         as default_variant_sku,
  v.size        as default_variant_size,
  v.price       as default_variant_price,

  coalesce(inv.stock_quantity - inv.reserved_quantity, 0) as available_quantity,
  coalesce(inv.allow_backorder, false)                    as allow_backorder

from public.products p
join public.categories c         on c.id = p.category_id
left join public.product_images img
  on  img.product_id = p.id
  and img.position   = 0
left join public.product_variants v
  on  v.product_id = p.id
  and v.is_default = true
left join public.inventory inv   on inv.variant_id = v.id
where
  p.status     = 'published'
  and p.deleted_at is null
  and c.is_active = true;

comment on view public.storefront_products is
  'Denormalised storefront products. Inline image data is represented by its existing versioned image endpoint URL. Respects caller RLS.';
