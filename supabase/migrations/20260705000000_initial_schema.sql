-- =============================================================================
-- WAQAR PERFUMES — Initial Production Schema
-- Migration: 20260705000000_initial_schema.sql
-- PostgreSQL 15+ / Supabase
-- =============================================================================
-- Table of Contents:
--   1.  Extensions & Configuration
--   2.  Helper Functions
--   3.  Triggers: updated_at
--   4.  AUTHENTICATION — profiles, admin_users
--   5.  CATALOG — categories, products, product_variants,
--                 product_images, fragrance_notes, tags, product_tags
--   6.  INVENTORY — inventory, inventory_movements
--   7.  COMMERCE — carts, cart_items, shipping_addresses, billing_addresses,
--                  coupons, coupon_usages, orders, order_items,
--                  order_status_history, payments
--   8.  CUSTOMER — wishlists, wishlist_items, reviews, review_votes,
--                  newsletter_subscribers, contact_messages
--   9.  ADMINISTRATION — audit_logs, site_settings
--   10. VIEWS — storefront_products, admin_order_summary,
--               admin_inventory_status, admin_revenue_overview
--   11. ROW LEVEL SECURITY — enable + policies for every table
--   12. INDEXES
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS & CONFIGURATION
-- =============================================================================

-- Required for UUID generation
create extension if not exists "pgcrypto";

-- Required for full-text search on products
create extension if not exists "pg_trgm";

-- Required for citext (case-insensitive text) on coupon codes / emails
create extension if not exists "citext";


-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- generate_order_number()
-- Produces sequential human-readable order numbers: WQ-10001, WQ-10002, …
-- Uses a dedicated sequence so numbers are never reused.
-- ----------------------------------------------------------------------------
create sequence if not exists waqar_order_seq
  start with 10001
  increment by 1
  no maxvalue
  cache 1;

create or replace function public.generate_order_number()
  returns text
  language sql
  security definer
  set search_path = public
as $$
  select 'WQ-' || nextval('waqar_order_seq')::text;
$$;

-- ----------------------------------------------------------------------------
-- is_admin()
-- Reads the role from the JWT app_metadata claim. Used in RLS policies.
-- Avoids a DB round-trip per policy check.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'),
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- is_super_admin()
-- ----------------------------------------------------------------------------
create or replace function public.is_super_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- slugify(text)
-- Converts a display name to a URL-safe slug.
-- e.g. "Golden Light EDP" → "golden-light-edp"
-- ----------------------------------------------------------------------------
create or replace function public.slugify(input text)
  returns text
  language plpgsql
  immutable
  set search_path = public
as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(input), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
end;
$$;


-- =============================================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

-- Single reusable trigger function — attached to every table that has updated_at
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Macro to attach the trigger (called after each table definition)
-- Usage: perform create_updated_at_trigger('table_name');
-- We inline the CREATE TRIGGER statements directly for clarity.


-- =============================================================================
-- 4. AUTHENTICATION
-- =============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- One row per auth.users entry. Created automatically by trigger.
-- Stores public customer-facing data. Never exposes sensitive auth fields.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         citext      not null unique,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          text        not null default 'customer'
                            check (role in ('customer', 'admin', 'super_admin')),
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz                             -- soft delete
);

comment on table public.profiles is
  'Public user profile data, one row per auth.users entry.';
comment on column public.profiles.role is
  'Application-level role. Kept in sync with auth.users.app_metadata.role via trigger.';

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- handle_new_user() — fires on auth.users INSERT
-- Creates the matching profile row automatically.
-- Sets role in both profiles and auth.users.app_metadata.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- sync_profile_role_to_jwt()
-- When profiles.role changes, updates auth.users.app_metadata so the next
-- JWT issued picks up the new role without manual intervention.
-- ----------------------------------------------------------------------------
create or replace function public.sync_profile_role_to_jwt()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.role <> old.role then
    update auth.users
    set    raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new.role)
    where  id = new.id;
  end if;
  return new;
end;
$$;

create trigger trg_profile_role_changed
  after update of role on public.profiles
  for each row execute function public.sync_profile_role_to_jwt();

-- ----------------------------------------------------------------------------
-- admin_users
-- Explicit registry of admin accounts. Separate from profiles so admin
-- access can be audited and revoked without touching auth.users directly.
-- ----------------------------------------------------------------------------
create table public.admin_users (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null unique references public.profiles(id) on delete cascade,
  role          text        not null default 'admin'
                            check (role in ('admin', 'super_admin')),
  granted_by    uuid        references public.profiles(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.admin_users is
  'Registry of users with admin access. Inserting here also triggers profile role sync.';

create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- When an admin_users row is inserted/updated, mirror the role onto profiles
create or replace function public.sync_admin_role_to_profile()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.profiles
  set    role = new.role
  where  id   = new.user_id;
  return new;
end;
$$;

create trigger trg_admin_user_role_sync
  after insert or update of role on public.admin_users
  for each row execute function public.sync_admin_role_to_profile();

-- When an admin_users row is deleted, demote back to customer
create or replace function public.demote_admin_to_customer()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.profiles
  set    role = 'customer'
  where  id   = old.user_id;
  return old;
end;
$$;

create trigger trg_admin_user_demote
  after delete on public.admin_users
  for each row execute function public.demote_admin_to_customer();


-- =============================================================================
-- 5. CATALOG
-- =============================================================================

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table public.categories (
  id            uuid        primary key default gen_random_uuid(),
  slug          text        not null unique,
  name          text        not null,
  description   text,
  image_url     text,
  position      smallint    not null default 0,   -- display order
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.categories is
  'Product categories: summer, winter, bundle, etc.';

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- tags  (reusable keyword labels: floral, woody, oriental …)
-- ----------------------------------------------------------------------------
create table public.tags (
  id            uuid        primary key default gen_random_uuid(),
  slug          text        not null unique,
  name          text        not null,
  created_at    timestamptz not null default now()
);

comment on table public.tags is
  'Reusable keyword tags attached to products via product_tags.';

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table public.products (
  id                uuid        primary key default gen_random_uuid(),
  slug              text        not null unique,
  name              text        not null,
  subtitle          text,                          -- "Eau de Parfum"
  category_id       uuid        not null references public.categories(id) on delete restrict,
  description       text,                          -- short (card-level)
  long_description  text,                          -- full (detail page)
  ingredients       text,
  base_price        numeric(10,2) not null
                    check (base_price >= 0),
  compare_at_price  numeric(10,2)
                    check (compare_at_price is null or compare_at_price > base_price),
  status            text        not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),
  is_best_seller    boolean     not null default false,
  is_new            boolean     not null default false,
  is_featured       boolean     not null default false,
  rating            numeric(3,2) not null default 0.00
                    check (rating >= 0 and rating <= 5),
  review_count      integer     not null default 0
                    check (review_count >= 0),
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz                    -- soft delete
);

comment on table public.products is
  'Core product catalogue. Pricing lives here (base) and on variants (override).';
comment on column public.products.compare_at_price is
  'Original price shown as struck-through when base_price is a sale price.';
comment on column public.products.status is
  'draft: invisible everywhere. published: live on storefront. archived: hidden but preserved.';

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Auto-generate slug from name if not provided
create or replace function public.set_product_slug()
  returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  if new.slug is null or trim(new.slug) = '' then
    new.slug = public.slugify(new.name);
  end if;
  return new;
end;
$$;

create trigger trg_products_slug
  before insert on public.products
  for each row execute function public.set_product_slug();

-- ----------------------------------------------------------------------------
-- product_variants
-- Each product has at least one variant (size / concentration).
-- This is where SKU and per-variant pricing lives.
-- ----------------------------------------------------------------------------
create table public.product_variants (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products(id) on delete cascade,
  sku           text        not null unique,
  size          text        not null,              -- "50ml", "100ml", "30ml"
  concentration text,                             -- "EDP", "EDT", "Extrait"
  price         numeric(10,2) not null
                check (price >= 0),
  compare_at_price numeric(10,2)
                check (compare_at_price is null or compare_at_price > price),
  is_default    boolean     not null default false, -- the variant shown first
  position      smallint    not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.product_variants is
  'Size / concentration variants of a product. Each variant has its own SKU and inventory row.';
comment on column public.product_variants.is_default is
  'Exactly one variant per product should have is_default = true (enforced by partial index).';

create trigger trg_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Enforce only one default variant per product
create unique index idx_product_variants_one_default
  on public.product_variants(product_id)
  where is_default = true;

-- ----------------------------------------------------------------------------
-- product_images
-- Ordered gallery images stored as Cloudinary URLs.
-- position = 0 is the primary (hero) image.
-- ----------------------------------------------------------------------------
create table public.product_images (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products(id) on delete cascade,
  url           text        not null,
  alt_text      text,
  position      smallint    not null default 0,   -- 0 = primary image
  cloudinary_id text,                             -- Cloudinary public_id for deletion
  created_at    timestamptz not null default now()
);

comment on table public.product_images is
  'Cloudinary image URLs for the product gallery. position=0 is the hero image.';

-- ----------------------------------------------------------------------------
-- fragrance_notes
-- Top / heart / base notes per product.
-- Stored as individual rows for easy querying / filtering.
-- ----------------------------------------------------------------------------
create table public.fragrance_notes (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products(id) on delete cascade,
  type          text        not null check (type in ('top', 'heart', 'base')),
  name          text        not null,
  position      smallint    not null default 0,
  created_at    timestamptz not null default now(),
  unique (product_id, type, name)                -- no duplicate notes on same product+type
);

comment on table public.fragrance_notes is
  'Individual fragrance notes (top / heart / base) per product.';

-- ----------------------------------------------------------------------------
-- product_tags  (many-to-many join)
-- ----------------------------------------------------------------------------
create table public.product_tags (
  product_id    uuid        not null references public.products(id) on delete cascade,
  tag_id        uuid        not null references public.tags(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (product_id, tag_id)
);

comment on table public.product_tags is
  'Many-to-many join between products and tags.';


-- =============================================================================
-- 6. INVENTORY
-- =============================================================================

-- ----------------------------------------------------------------------------
-- inventory
-- One row per product_variant. Source of truth for available stock.
-- reserved_quantity = items in active (not yet confirmed) orders.
-- available_quantity = stock_quantity - reserved_quantity  (computed column).
-- ----------------------------------------------------------------------------
create table public.inventory (
  id                  uuid        primary key default gen_random_uuid(),
  variant_id          uuid        not null unique references public.product_variants(id) on delete cascade,
  stock_quantity      integer     not null default 0
                      check (stock_quantity >= 0),
  reserved_quantity   integer     not null default 0
                      check (reserved_quantity >= 0),
  reorder_threshold   integer     not null default 10
                      check (reorder_threshold >= 0),
  allow_backorder     boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- available must never be negative (unless backorders allowed)
  constraint chk_inventory_available
    check (allow_backorder or stock_quantity >= reserved_quantity)
);

comment on table public.inventory is
  'Stock levels per variant. available = stock_quantity - reserved_quantity.';

create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- Automatically create an inventory row when a variant is created
create or replace function public.create_inventory_for_variant()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.inventory (variant_id)
  values (new.id)
  on conflict (variant_id) do nothing;
  return new;
end;
$$;

create trigger trg_variant_inventory_create
  after insert on public.product_variants
  for each row execute function public.create_inventory_for_variant();

-- ----------------------------------------------------------------------------
-- inventory_movements
-- Append-only audit trail of every stock change.
-- reason covers: 'sale', 'return', 'adjustment', 'restock', 'reservation',
--                'reservation_released', 'reservation_confirmed'
-- ----------------------------------------------------------------------------
create table public.inventory_movements (
  id            uuid        primary key default gen_random_uuid(),
  variant_id    uuid        not null references public.product_variants(id) on delete restrict,
  order_id      uuid,                              -- FK added after orders table is created
  quantity      integer     not null,              -- positive = stock in, negative = stock out
  reason        text        not null
                check (reason in (
                  'sale', 'return', 'adjustment', 'restock',
                  'reservation', 'reservation_released', 'reservation_confirmed',
                  'damage', 'correction'
                )),
  notes         text,
  performed_by  uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

comment on table public.inventory_movements is
  'Append-only log of all inventory changes. Never update or delete rows.';


-- =============================================================================
-- 7. COMMERCE
-- =============================================================================

-- ----------------------------------------------------------------------------
-- shipping_addresses
-- Reusable saved addresses linked to a user profile.
-- Orders snapshot the address at time of placement (stored in order columns).
-- ----------------------------------------------------------------------------
create table public.shipping_addresses (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  full_name       text        not null,
  phone           text,
  address_line_1  text        not null,
  address_line_2  text,
  city            text        not null,
  state           text,
  postal_code     text,
  country_code    char(2)     not null,            -- ISO 3166-1 alpha-2
  is_default      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.shipping_addresses is
  'Saved shipping addresses per customer. One may be flagged as default.';

create trigger trg_shipping_addresses_updated_at
  before update on public.shipping_addresses
  for each row execute function public.set_updated_at();

-- Only one default shipping address per user
create unique index idx_shipping_addresses_one_default
  on public.shipping_addresses(user_id)
  where is_default = true;

-- ----------------------------------------------------------------------------
-- billing_addresses
-- Same structure as shipping; kept separate to allow independent management.
-- ----------------------------------------------------------------------------
create table public.billing_addresses (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  full_name       text        not null,
  phone           text,
  address_line_1  text        not null,
  address_line_2  text,
  city            text        not null,
  state           text,
  postal_code     text,
  country_code    char(2)     not null,
  is_default      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_billing_addresses_updated_at
  before update on public.billing_addresses
  for each row execute function public.set_updated_at();

create unique index idx_billing_addresses_one_default
  on public.billing_addresses(user_id)
  where is_default = true;

-- ----------------------------------------------------------------------------
-- coupons
-- Discount codes. Supports percentage or fixed-amount discounts.
-- ----------------------------------------------------------------------------
create table public.coupons (
  id                  uuid        primary key default gen_random_uuid(),
  code                citext      not null unique,  -- case-insensitive lookup
  description         text,
  discount_type       text        not null check (discount_type in ('percentage', 'fixed')),
  discount_value      numeric(10,2) not null check (discount_value > 0),
  minimum_order_value numeric(10,2) not null default 0
                      check (minimum_order_value >= 0),
  maximum_discount    numeric(10,2)               -- cap for percentage discounts
                      check (maximum_discount is null or maximum_discount > 0),
  usage_limit         integer                     -- null = unlimited
                      check (usage_limit is null or usage_limit > 0),
  usage_count         integer     not null default 0
                      check (usage_count >= 0),
  per_user_limit      integer     not null default 1
                      check (per_user_limit > 0),
  status              text        not null default 'active'
                      check (status in ('active', 'draft', 'expired', 'disabled')),
  valid_from          timestamptz not null default now(),
  valid_until         timestamptz
                      check (valid_until is null or valid_until > valid_from),
  created_by          uuid        references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.coupons is
  'Discount coupons. code is case-insensitive. Supports percentage and fixed-amount types.';

create trigger trg_coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- carts
-- One active cart per authenticated user. Guest carts use session_token.
-- A user_id and session_token are mutually exclusive (one must be non-null).
-- ----------------------------------------------------------------------------
create table public.carts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        unique references public.profiles(id) on delete cascade,
  session_token   text        unique,             -- for guest carts (UUID stored in cookie)
  coupon_id       uuid        references public.coupons(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Exactly one of user_id or session_token must be set
  constraint chk_cart_owner check (
    (user_id is not null and session_token is null) or
    (user_id is null     and session_token is not null)
  )
);

comment on table public.carts is
  'Active shopping carts. user_id for logged-in users, session_token for guests.';

create trigger trg_carts_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- cart_items
-- ----------------------------------------------------------------------------
create table public.cart_items (
  id            uuid        primary key default gen_random_uuid(),
  cart_id       uuid        not null references public.carts(id) on delete cascade,
  variant_id    uuid        not null references public.product_variants(id) on delete cascade,
  quantity      integer     not null default 1 check (quantity > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (cart_id, variant_id)                    -- one row per variant per cart
);

create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- orders
-- Immutable header once placed. Status changes tracked in order_status_history.
-- Address data is snapshotted at placement time (JSON) to survive address edits.
-- ----------------------------------------------------------------------------
create table public.orders (
  id                    uuid        primary key default gen_random_uuid(),
  order_number          text        not null unique default public.generate_order_number(),
  user_id               uuid        references public.profiles(id) on delete set null,

  -- Status
  status                text        not null default 'pending'
                        check (status in (
                          'pending', 'processing', 'shipped',
                          'delivered', 'cancelled', 'refunded'
                        )),
  payment_status        text        not null default 'pending'
                        check (payment_status in (
                          'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
                        )),

  -- Pricing (all amounts in the store's base currency, cents stored as numeric)
  subtotal              numeric(10,2) not null check (subtotal >= 0),
  discount_amount       numeric(10,2) not null default 0 check (discount_amount >= 0),
  shipping_amount       numeric(10,2) not null default 0 check (shipping_amount >= 0),
  tax_amount            numeric(10,2) not null default 0 check (tax_amount >= 0),
  total                 numeric(10,2) not null check (total >= 0),
  currency              char(3)     not null default 'EGP',

  -- Coupon
  coupon_id             uuid        references public.coupons(id) on delete set null,
  coupon_code           text,                     -- snapshot of code at order time

  -- Address snapshots (JSON so orders survive profile edits)
  shipping_address      jsonb       not null,
  billing_address       jsonb,

  -- Fulfillment
  shipping_method       text,
  tracking_number       text,
  tracking_url          text,
  estimated_delivery    date,
  shipped_at            timestamptz,
  delivered_at          timestamptz,

  -- Notes
  customer_notes        text,
  admin_notes           text,

  -- Metadata
  ip_address            inet,
  user_agent            text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.orders is
  'Order headers. Address data is JSON-snapshotted at placement. Line items in order_items.';
comment on column public.orders.shipping_address is
  'Snapshot of shipping address at order placement. Survives future address edits.';

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Add FK from inventory_movements to orders now that orders table exists
alter table public.inventory_movements
  add constraint fk_inventory_movements_order
  foreign key (order_id) references public.orders(id) on delete set null;

-- ----------------------------------------------------------------------------
-- order_status_history
-- Append-only log of every order status transition.
-- ----------------------------------------------------------------------------
create table public.order_status_history (
  id              uuid        primary key default gen_random_uuid(),
  order_id        uuid        not null references public.orders(id) on delete cascade,
  from_status     text,                           -- null on first entry
  to_status       text        not null,
  changed_by      uuid        references public.profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);

comment on table public.order_status_history is
  'Append-only audit trail of every order status change.';

-- Automatically record status changes on orders
create or replace function public.record_order_status_change()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history
      (order_id, from_status, to_status, changed_by)
    values
      (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_order_status_change
  after update of status on public.orders
  for each row execute function public.record_order_status_change();

-- ----------------------------------------------------------------------------
-- order_items
-- Immutable snapshot of what was purchased and at what price.
-- Variant / product data is copied at placement time.
-- ----------------------------------------------------------------------------
create table public.order_items (
  id                uuid        primary key default gen_random_uuid(),
  order_id          uuid        not null references public.orders(id) on delete cascade,
  variant_id        uuid        references public.product_variants(id) on delete set null,
  product_id        uuid        references public.products(id) on delete set null,

  -- Snapshots — preserved even if product/variant is later edited or deleted
  product_name      text        not null,
  variant_sku       text        not null,
  variant_size      text        not null,
  image_url         text,
  unit_price        numeric(10,2) not null check (unit_price >= 0),
  quantity          integer     not null check (quantity > 0),
  total_price       numeric(10,2) not null check (total_price >= 0),
  created_at        timestamptz not null default now()
);

comment on table public.order_items is
  'Immutable line items for an order. All prices and names are snapshotted at placement.';

-- ----------------------------------------------------------------------------
-- coupon_usages
-- Records each time a coupon is redeemed against an order.
-- Append-only — deletions are never allowed.
-- ----------------------------------------------------------------------------
create table public.coupon_usages (
  id          uuid        primary key default gen_random_uuid(),
  coupon_id   uuid        not null references public.coupons(id) on delete restrict,
  order_id    uuid        not null unique references public.orders(id) on delete restrict,
  user_id     uuid        references public.profiles(id) on delete set null,
  discount_applied numeric(10,2) not null check (discount_applied >= 0),
  created_at  timestamptz not null default now()
);

comment on table public.coupon_usages is
  'Records coupon redemptions. One row per order. Used to enforce per-user limits.';

-- Increment coupon usage_count when a usage is recorded
create or replace function public.increment_coupon_usage()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.coupons
  set    usage_count = usage_count + 1
  where  id = new.coupon_id;
  return new;
end;
$$;

create trigger trg_coupon_usage_increment
  after insert on public.coupon_usages
  for each row execute function public.increment_coupon_usage();

-- ----------------------------------------------------------------------------
-- payments
-- Payment attempts for an order. An order may have multiple attempts
-- (e.g., failed first, succeeded second).
-- ----------------------------------------------------------------------------
create table public.payments (
  id                    uuid        primary key default gen_random_uuid(),
  order_id              uuid        not null references public.orders(id) on delete restrict,
  provider              text        not null
                        check (provider in (
                          'stripe', 'paypal', 'vodafone_cash', 'etisalat_cash',
                          'orange_cash', 'we_pay', 'instapay', 'cash_on_delivery', 'other'
                        )),
  status                text        not null default 'pending'
                        check (status in (
                          'pending', 'processing', 'succeeded',
                          'failed', 'cancelled', 'refunded'
                        )),
  amount                numeric(10,2) not null check (amount > 0),
  currency              char(3)     not null default 'EGP',
  provider_reference    text,                     -- external payment ID / transaction ref
  provider_response     jsonb,                    -- raw response from payment provider
  failure_reason        text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.payments is
  'Payment attempts per order. Multiple rows allowed (retries). provider_response holds raw data.';

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Sync payment status to order payment_status on success
create or replace function public.sync_payment_to_order()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.status = 'succeeded' then
    update public.orders
    set    payment_status = 'paid',
           status = case when status = 'pending' then 'processing' else status end
    where  id = new.order_id;
  elsif new.status = 'refunded' then
    update public.orders
    set    payment_status = 'refunded'
    where  id = new.order_id;
  elsif new.status = 'failed' then
    update public.orders
    set    payment_status = 'failed'
    where  id = new.order_id;
  end if;
  return new;
end;
$$;

create trigger trg_payment_status_sync
  after update of status on public.payments
  for each row execute function public.sync_payment_to_order();


-- =============================================================================
-- 8. CUSTOMER
-- =============================================================================

-- ----------------------------------------------------------------------------
-- wishlists
-- One wishlist per user (created automatically on profile creation).
-- ----------------------------------------------------------------------------
create table public.wishlists (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null unique references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_wishlists_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

-- Auto-create wishlist when a profile is created
create or replace function public.create_wishlist_for_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.wishlists (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger trg_profile_wishlist_create
  after insert on public.profiles
  for each row execute function public.create_wishlist_for_user();

-- ----------------------------------------------------------------------------
-- wishlist_items
-- ----------------------------------------------------------------------------
create table public.wishlist_items (
  id            uuid        primary key default gen_random_uuid(),
  wishlist_id   uuid        not null references public.wishlists(id) on delete cascade,
  product_id    uuid        not null references public.products(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

comment on table public.wishlist_items is
  'Products saved to a user wishlist. Unique per product per wishlist.';

-- ----------------------------------------------------------------------------
-- reviews
-- Only users who have purchased the product can leave a review.
-- Admin approves before public display.
-- ----------------------------------------------------------------------------
create table public.reviews (
  id            uuid        primary key default gen_random_uuid(),
  product_id    uuid        not null references public.products(id) on delete cascade,
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  order_id      uuid        references public.orders(id) on delete set null, -- verified purchase
  rating        smallint    not null check (rating between 1 and 5),
  title         text,
  body          text,
  status        text        not null default 'pending'
                check (status in ('pending', 'approved', 'rejected', 'hidden')),
  helpful_count integer     not null default 0 check (helpful_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, user_id)                    -- one review per product per user
);

comment on table public.reviews is
  'Product reviews. status=approved required for storefront display. One per user per product.';

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Recompute product rating and review_count when a review is approved/created/deleted
create or replace function public.update_product_rating()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_product_id uuid;
begin
  v_product_id = coalesce(new.product_id, old.product_id);
  update public.products
  set
    rating       = coalesce((
      select round(avg(rating)::numeric, 2)
      from   public.reviews
      where  product_id = v_product_id
        and  status     = 'approved'
    ), 0),
    review_count = (
      select count(*)
      from   public.reviews
      where  product_id = v_product_id
        and  status     = 'approved'
    )
  where id = v_product_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_review_rating_update
  after insert or update of status or delete on public.reviews
  for each row execute function public.update_product_rating();

-- ----------------------------------------------------------------------------
-- review_votes  (helpful / not helpful)
-- ----------------------------------------------------------------------------
create table public.review_votes (
  id          uuid        primary key default gen_random_uuid(),
  review_id   uuid        not null references public.reviews(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  is_helpful  boolean     not null,
  created_at  timestamptz not null default now(),
  unique (review_id, user_id)
);

comment on table public.review_votes is
  'One helpful/unhelpful vote per user per review.';

-- Keep reviews.helpful_count in sync
create or replace function public.sync_review_helpful_count()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_review_id uuid;
begin
  v_review_id = coalesce(new.review_id, old.review_id);
  update public.reviews
  set    helpful_count = (
    select count(*) from public.review_votes
    where  review_id  = v_review_id and is_helpful = true
  )
  where id = v_review_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_review_vote_count_sync
  after insert or update or delete on public.review_votes
  for each row execute function public.sync_review_helpful_count();

-- ----------------------------------------------------------------------------
-- newsletter_subscribers
-- ----------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id              uuid        primary key default gen_random_uuid(),
  email           citext      not null unique,
  status          text        not null default 'active'
                  check (status in ('active', 'unsubscribed', 'bounced')),
  source          text,                           -- 'footer', 'checkout', 'popup', etc.
  ip_address      inet,
  created_at      timestamptz not null default now(),  -- standard audit column
  subscribed_at   timestamptz not null default now(),  -- domain-specific alias
  unsubscribed_at timestamptz
);

comment on table public.newsletter_subscribers is
  'Email newsletter opt-ins. Unique by email. status tracks subscription lifecycle.';

-- ----------------------------------------------------------------------------
-- contact_messages
-- ----------------------------------------------------------------------------
create table public.contact_messages (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references public.profiles(id) on delete set null,
  name            text        not null,
  email           citext      not null,
  subject         text,
  message         text        not null,
  status          text        not null default 'unread'
                  check (status in ('unread', 'read', 'replied', 'archived')),
  admin_notes     text,
  ip_address      inet,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.contact_messages is
  'Contact form submissions. Admin manages inbox via status field.';

create trigger trg_contact_messages_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 9. ADMINISTRATION
-- =============================================================================

-- ----------------------------------------------------------------------------
-- audit_logs
-- Append-only record of every admin write operation.
-- Populated by a generic trigger attached to sensitive tables.
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id            uuid        primary key default gen_random_uuid(),
  admin_id      uuid        references public.profiles(id) on delete set null,
  action        text        not null
                check (action in ('insert', 'update', 'delete')),
  table_name    text        not null,
  record_id     uuid        not null,
  old_data      jsonb,                            -- null for inserts
  new_data      jsonb,                            -- null for deletes
  ip_address    inet,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only admin audit trail. Never update or delete rows. Populated by triggers.';

-- Generic audit trigger function — attach to any table requiring audit
create or replace function public.log_audit_event()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.audit_logs
    (admin_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce((new.id)::uuid, (old.id)::uuid),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- Attach audit logging to high-value tables
create trigger trg_audit_products
  after insert or update or delete on public.products
  for each row execute function public.log_audit_event();

create trigger trg_audit_orders
  after insert or update or delete on public.orders
  for each row execute function public.log_audit_event();

create trigger trg_audit_inventory
  after insert or update or delete on public.inventory
  for each row execute function public.log_audit_event();

create trigger trg_audit_coupons
  after insert or update or delete on public.coupons
  for each row execute function public.log_audit_event();

create trigger trg_audit_profiles
  after update or delete on public.profiles
  for each row execute function public.log_audit_event();

-- ----------------------------------------------------------------------------
-- site_settings
-- Key/value store for global configuration.
-- Admins manage via the Settings page. Storefront reads publicly-safe keys.
-- is_public controls which keys the anon role can read.
-- ----------------------------------------------------------------------------
create table public.site_settings (
  key           text        primary key,
  value         jsonb       not null,
  description   text,
  is_public     boolean     not null default false, -- anon-readable if true
  updated_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.site_settings is
  'Key/value store for global config. is_public=true allows anon reads (e.g. currency, store name).';

create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Seed default settings
insert into public.site_settings (key, value, description, is_public) values
  ('store_name',          '"WAQAR Perfumes"',               'Display name of the store',             true),
  ('store_email',         '"hello@waqar.com"',              'Public contact email',                  true),
  ('store_currency',      '"EGP"',                          'ISO 4217 currency code',                true),
  ('store_currency_symbol','"$"',                           'Currency symbol for display',           true),
  ('tax_rate',            '0',                              'Tax rate as a decimal (e.g. 0.05)',     false),
  ('tax_included',        'false',                          'Whether prices include tax',            true),
  ('shipping_free_threshold', '150',                        'Order value for free shipping (EGP)',   true),
  ('shipping_standard_rate',  '12',                         'Standard shipping rate (EGP)',          true),
  ('shipping_express_rate',   '25',                         'Express shipping rate (EGP)',           true),
  ('shipping_standard_days',  '"3-5"',                      'Standard delivery window',             true),
  ('shipping_express_days',   '"1-2"',                      'Express delivery window',              true),
  ('social_instagram',    '"https://instagram.com/waqarperfumes"', 'Instagram URL',                 true),
  ('social_twitter',      '""',                             'Twitter/X URL',                        true),
  ('social_facebook',     '""',                             'Facebook URL',                         true),
  ('maintenance_mode',    'false',                          'Put storefront in maintenance mode',   false),
  ('allow_reviews',       'true',                           'Allow customers to submit reviews',    true),
  ('require_purchase_for_review', 'true',                   'Require verified purchase for review', false)
on conflict (key) do nothing;


-- =============================================================================
-- 10. VIEWS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- storefront_products
-- Public-facing product view. Joins in primary image, category, and default
-- variant price. Excludes draft and soft-deleted products.
-- Used by the storefront to avoid complex multi-table joins on every query.
-- ----------------------------------------------------------------------------
create or replace view public.storefront_products
  with (security_invoker = true)   -- respects the caller's RLS context
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

  -- Category
  c.id          as category_id,
  c.slug        as category_slug,
  c.name        as category_name,

  -- Primary image (position = 0)
  img.url       as primary_image_url,
  img.alt_text  as primary_image_alt,

  -- Default variant
  v.id          as default_variant_id,
  v.sku         as default_variant_sku,
  v.size        as default_variant_size,
  v.price       as default_variant_price,

  -- Inventory availability (from default variant)
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
  'Denormalised product view for storefront queries. Respects caller RLS. Excludes draft/archived/deleted.';

-- ----------------------------------------------------------------------------
-- admin_order_summary
-- Used by the admin orders page and dashboard.
-- ----------------------------------------------------------------------------
create or replace view public.admin_order_summary
  with (security_invoker = true)
as
select
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  o.subtotal,
  o.discount_amount,
  o.shipping_amount,
  o.tax_amount,
  o.total,
  o.currency,
  o.coupon_code,
  o.shipping_method,
  o.tracking_number,
  o.created_at,
  o.shipped_at,
  o.delivered_at,

  -- Customer info
  p.id         as customer_id,
  p.full_name  as customer_name,
  p.email      as customer_email,

  -- Item count
  (select count(*) from public.order_items oi where oi.order_id = o.id) as item_count,

  -- Payment provider
  pay.provider as payment_provider

from public.orders o
left join public.profiles p     on p.id = o.user_id
left join public.payments pay
  on  pay.order_id = o.id
  and pay.status   = 'succeeded';

comment on view public.admin_order_summary is
  'Denormalised orders view for admin panel. Includes customer name, email, payment provider.';

-- ----------------------------------------------------------------------------
-- admin_inventory_status
-- Products + stock levels for admin inventory management.
-- ----------------------------------------------------------------------------
create or replace view public.admin_inventory_status
  with (security_invoker = true)
as
select
  pv.id           as variant_id,
  pv.sku,
  pv.size,
  pv.concentration,
  pv.price,
  pv.is_active    as variant_active,

  p.id            as product_id,
  p.slug          as product_slug,
  p.name          as product_name,
  p.status        as product_status,

  inv.stock_quantity,
  inv.reserved_quantity,
  (inv.stock_quantity - inv.reserved_quantity) as available_quantity,
  inv.reorder_threshold,
  inv.allow_backorder,

  -- Flags for quick admin filtering
  (inv.stock_quantity = 0)                               as is_out_of_stock,
  (inv.stock_quantity > 0
   and inv.stock_quantity <= inv.reorder_threshold)      as is_low_stock

from public.product_variants pv
join public.products p    on p.id = pv.product_id
join public.inventory inv on inv.variant_id = pv.id
where p.deleted_at is null;

comment on view public.admin_inventory_status is
  'Inventory levels per variant for admin management. Includes low-stock and out-of-stock flags.';

-- ----------------------------------------------------------------------------
-- admin_revenue_overview
-- Aggregated revenue metrics for the admin dashboard.
-- ----------------------------------------------------------------------------
create or replace view public.admin_revenue_overview
  with (security_invoker = true)
as
select
  -- All-time
  count(*)                                  as total_orders,
  sum(total)                                as total_revenue,
  avg(total)                                as avg_order_value,

  -- Last 30 days
  count(*) filter (
    where created_at >= now() - interval '30 days'
  )                                         as orders_last_30d,
  sum(total) filter (
    where created_at >= now() - interval '30 days'
  )                                         as revenue_last_30d,

  -- Last 7 days
  count(*) filter (
    where created_at >= now() - interval '7 days'
  )                                         as orders_last_7d,
  sum(total) filter (
    where created_at >= now() - interval '7 days'
  )                                         as revenue_last_7d,

  -- By status
  count(*) filter (where status = 'pending')    as pending_orders,
  count(*) filter (where status = 'processing') as processing_orders,
  count(*) filter (where status = 'shipped')    as shipped_orders,
  count(*) filter (where status = 'delivered')  as delivered_orders,
  count(*) filter (where status = 'cancelled')  as cancelled_orders

from public.orders
where payment_status = 'paid';

comment on view public.admin_revenue_overview is
  'Aggregated revenue and order metrics for the admin dashboard.';


-- =============================================================================
-- 11. ROW LEVEL SECURITY
-- =============================================================================
-- Conventions:
--   - RLS enabled on every table
--   - Policies are named: <table>_<actor>_<operation>
--   - "admin" policies use public.is_admin() which reads JWT claims (no DB hit)
--   - Service role bypasses RLS — used only in server-side Server Actions
-- =============================================================================

-- ── Enable RLS on all tables ─────────────────────────────────────────────────

alter table public.profiles               enable row level security;
alter table public.admin_users            enable row level security;
alter table public.categories             enable row level security;
alter table public.tags                   enable row level security;
alter table public.products               enable row level security;
alter table public.product_variants       enable row level security;
alter table public.product_images         enable row level security;
alter table public.fragrance_notes        enable row level security;
alter table public.product_tags           enable row level security;
alter table public.inventory              enable row level security;
alter table public.inventory_movements    enable row level security;
alter table public.shipping_addresses     enable row level security;
alter table public.billing_addresses      enable row level security;
alter table public.coupons                enable row level security;
alter table public.carts                  enable row level security;
alter table public.cart_items             enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_status_history   enable row level security;
alter table public.coupon_usages          enable row level security;
alter table public.payments               enable row level security;
alter table public.wishlists              enable row level security;
alter table public.wishlist_items         enable row level security;
alter table public.reviews                enable row level security;
alter table public.review_votes           enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.site_settings          enable row level security;


-- ── profiles ─────────────────────────────────────────────────────────────────

-- Anyone can read their own profile
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Users update their own profile; admins update any
create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Only the trigger (security definer) inserts profiles; no direct insert
create policy profiles_insert_trigger
  on public.profiles for insert
  with check (false);                             -- blocks direct insert; trigger bypasses RLS

-- Only super_admin can hard-delete profiles
create policy profiles_delete_admin
  on public.profiles for delete
  using (public.is_super_admin());


-- ── admin_users ───────────────────────────────────────────────────────────────

-- Admins can see the admin registry; super_admin can manage it
create policy admin_users_select
  on public.admin_users for select
  using (public.is_admin());

create policy admin_users_insert
  on public.admin_users for insert
  with check (public.is_super_admin());

create policy admin_users_update
  on public.admin_users for update
  using (public.is_super_admin());

create policy admin_users_delete
  on public.admin_users for delete
  using (public.is_super_admin());


-- ── categories ───────────────────────────────────────────────────────────────

-- Public read of active categories
create policy categories_select_public
  on public.categories for select
  using (is_active = true or public.is_admin());

create policy categories_insert_admin
  on public.categories for insert
  with check (public.is_admin());

create policy categories_update_admin
  on public.categories for update
  using (public.is_admin());

create policy categories_delete_admin
  on public.categories for delete
  using (public.is_admin());


-- ── tags & product_tags ───────────────────────────────────────────────────────

create policy tags_select_public
  on public.tags for select using (true);

create policy tags_admin
  on public.tags for all using (public.is_admin());

create policy product_tags_select_public
  on public.product_tags for select using (true);

create policy product_tags_admin
  on public.product_tags for all using (public.is_admin());


-- ── products ─────────────────────────────────────────────────────────────────

-- Storefront: published & not soft-deleted products
create policy products_select_public
  on public.products for select
  using (
    (status = 'published' and deleted_at is null)
    or public.is_admin()
  );

create policy products_insert_admin
  on public.products for insert
  with check (public.is_admin());

create policy products_update_admin
  on public.products for update
  using (public.is_admin());

create policy products_delete_admin
  on public.products for delete
  using (public.is_admin());


-- ── product_variants ─────────────────────────────────────────────────────────

create policy product_variants_select_public
  on public.product_variants for select
  using (
    is_active = true
    or public.is_admin()
  );

create policy product_variants_admin
  on public.product_variants for all using (public.is_admin());


-- ── product_images ────────────────────────────────────────────────────────────

create policy product_images_select_public
  on public.product_images for select using (true);

create policy product_images_admin
  on public.product_images for all using (public.is_admin());


-- ── fragrance_notes ───────────────────────────────────────────────────────────

create policy fragrance_notes_select_public
  on public.fragrance_notes for select using (true);

create policy fragrance_notes_admin
  on public.fragrance_notes for all using (public.is_admin());


-- ── inventory ────────────────────────────────────────────────────────────────

-- Customers need to know availability; admins need full access
create policy inventory_select_public
  on public.inventory for select using (true);

create policy inventory_admin
  on public.inventory for all using (public.is_admin());


-- ── inventory_movements ───────────────────────────────────────────────────────

-- Admins read; no one deletes (append-only enforced)
create policy inventory_movements_select_admin
  on public.inventory_movements for select
  using (public.is_admin());

create policy inventory_movements_insert_admin
  on public.inventory_movements for insert
  with check (public.is_admin());

-- No UPDATE or DELETE policies — append-only by omission


-- ── shipping_addresses ────────────────────────────────────────────────────────

create policy shipping_addresses_own
  on public.shipping_addresses for all
  using (user_id = auth.uid() or public.is_admin());

create policy shipping_addresses_insert_own
  on public.shipping_addresses for insert
  with check (user_id = auth.uid() or public.is_admin());


-- ── billing_addresses ─────────────────────────────────────────────────────────

create policy billing_addresses_own
  on public.billing_addresses for all
  using (user_id = auth.uid() or public.is_admin());

create policy billing_addresses_insert_own
  on public.billing_addresses for insert
  with check (user_id = auth.uid() or public.is_admin());


-- ── coupons ───────────────────────────────────────────────────────────────────

-- Customers may SELECT active coupons (for validation); only admins manage them
create policy coupons_select_active
  on public.coupons for select
  using (status = 'active' or public.is_admin());

create policy coupons_admin
  on public.coupons for all using (public.is_admin());


-- ── carts ────────────────────────────────────────────────────────────────────

-- Users access their own cart; guests access by session_token (validated server-side)
create policy carts_select_own
  on public.carts for select
  using (user_id = auth.uid() or public.is_admin());

create policy carts_insert_own
  on public.carts for insert
  with check (
    user_id = auth.uid()
    or user_id is null   -- guest cart; session_token validated in application layer
    or public.is_admin()
  );

create policy carts_update_own
  on public.carts for update
  using (user_id = auth.uid() or public.is_admin());

create policy carts_delete_own
  on public.carts for delete
  using (user_id = auth.uid() or public.is_admin());


-- ── cart_items ────────────────────────────────────────────────────────────────

create policy cart_items_own
  on public.cart_items for all
  using (
    cart_id in (
      select id from public.carts where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy cart_items_insert_own
  on public.cart_items for insert
  with check (
    cart_id in (
      select id from public.carts where user_id = auth.uid()
    )
    or public.is_admin()
  );


-- ── orders ────────────────────────────────────────────────────────────────────

-- Customers read their own orders; admins read all
create policy orders_select_own
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

-- Only server actions (service role) insert orders; no direct customer insert
create policy orders_insert_service
  on public.orders for insert
  with check (public.is_admin());               -- service role bypasses; this blocks direct client insert

create policy orders_update_admin
  on public.orders for update
  using (public.is_admin());

-- No delete policy — orders are never deleted


-- ── order_items ───────────────────────────────────────────────────────────────

create policy order_items_select_own
  on public.order_items for select
  using (
    order_id in (
      select id from public.orders where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy order_items_insert_service
  on public.order_items for insert
  with check (public.is_admin());


-- ── order_status_history ──────────────────────────────────────────────────────

create policy order_status_history_select_own
  on public.order_status_history for select
  using (
    order_id in (
      select id from public.orders where user_id = auth.uid()
    )
    or public.is_admin()
  );

-- Insert only via trigger (security definer); no direct inserts
create policy order_status_history_insert_trigger
  on public.order_status_history for insert
  with check (public.is_admin());


-- ── coupon_usages ─────────────────────────────────────────────────────────────

-- Customers may check their own usages (for per-user limit enforcement)
create policy coupon_usages_select_own
  on public.coupon_usages for select
  using (user_id = auth.uid() or public.is_admin());

create policy coupon_usages_insert_service
  on public.coupon_usages for insert
  with check (public.is_admin());

-- No UPDATE or DELETE — append-only


-- ── payments ─────────────────────────────────────────────────────────────────

create policy payments_select_own
  on public.payments for select
  using (
    order_id in (
      select id from public.orders where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy payments_admin
  on public.payments for all using (public.is_admin());


-- ── wishlists ─────────────────────────────────────────────────────────────────

create policy wishlists_own
  on public.wishlists for all
  using (user_id = auth.uid() or public.is_admin());


-- ── wishlist_items ────────────────────────────────────────────────────────────

create policy wishlist_items_own
  on public.wishlist_items for all
  using (
    wishlist_id in (
      select id from public.wishlists where user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy wishlist_items_insert_own
  on public.wishlist_items for insert
  with check (
    wishlist_id in (
      select id from public.wishlists where user_id = auth.uid()
    )
    or public.is_admin()
  );


-- ── reviews ───────────────────────────────────────────────────────────────────

-- Public reads approved reviews; users manage their own pending review
create policy reviews_select_approved
  on public.reviews for select
  using (
    status = 'approved'
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy reviews_insert_authenticated
  on public.reviews for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy reviews_update_own
  on public.reviews for update
  using (
    (user_id = auth.uid() and status = 'pending')  -- customer edits before approval
    or public.is_admin()
  );

create policy reviews_delete_admin
  on public.reviews for delete
  using (public.is_admin());


-- ── review_votes ──────────────────────────────────────────────────────────────

create policy review_votes_select_public
  on public.review_votes for select using (true);

create policy review_votes_insert_authenticated
  on public.review_votes for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy review_votes_delete_own
  on public.review_votes for delete
  using (user_id = auth.uid());


-- ── newsletter_subscribers ────────────────────────────────────────────────────

-- Anyone can subscribe (insert); only admins read the list
create policy newsletter_insert_anon
  on public.newsletter_subscribers for insert
  with check (true);

create policy newsletter_select_admin
  on public.newsletter_subscribers for select
  using (public.is_admin());

create policy newsletter_update_admin
  on public.newsletter_subscribers for update
  using (public.is_admin());


-- ── contact_messages ─────────────────────────────────────────────────────────

-- Anyone can submit; only admins read
create policy contact_insert_anon
  on public.contact_messages for insert
  with check (true);

create policy contact_select_admin
  on public.contact_messages for select
  using (public.is_admin());

create policy contact_update_admin
  on public.contact_messages for update
  using (public.is_admin());


-- ── audit_logs ────────────────────────────────────────────────────────────────

-- Admins read; inserts only via trigger (security definer)
create policy audit_logs_select_admin
  on public.audit_logs for select
  using (public.is_admin());

-- No direct insert policy — triggers use security definer to bypass RLS


-- ── site_settings ─────────────────────────────────────────────────────────────

-- Public keys readable by anyone; secret keys admin-only
create policy site_settings_select_public
  on public.site_settings for select
  using (is_public = true or public.is_admin());

create policy site_settings_admin
  on public.site_settings for all using (public.is_admin());


-- =============================================================================
-- 12. INDEXES
-- =============================================================================

-- ── products ─────────────────────────────────────────────────────────────────
create index idx_products_slug                  on public.products(slug);
create index idx_products_category_id           on public.products(category_id);
create index idx_products_status                on public.products(status) where deleted_at is null;
create index idx_products_best_seller           on public.products(is_best_seller) where status = 'published' and deleted_at is null;
create index idx_products_new                   on public.products(is_new) where status = 'published' and deleted_at is null;
create index idx_products_featured              on public.products(is_featured) where status = 'published' and deleted_at is null;
create index idx_products_created_at            on public.products(created_at desc);
create index idx_products_deleted_at            on public.products(deleted_at) where deleted_at is not null;

-- Full-text search on product name + description
create index idx_products_fts on public.products
  using gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(subtitle, '')));

-- Trigram index for ILIKE searches
create index idx_products_name_trgm on public.products using gin(name gin_trgm_ops);

-- ── product_variants ─────────────────────────────────────────────────────────
create index idx_product_variants_product_id    on public.product_variants(product_id);
create index idx_product_variants_sku           on public.product_variants(sku);

-- ── product_images ────────────────────────────────────────────────────────────
create index idx_product_images_product_id_pos  on public.product_images(product_id, position);

-- ── fragrance_notes ───────────────────────────────────────────────────────────
create index idx_fragrance_notes_product_id     on public.fragrance_notes(product_id);
create index idx_fragrance_notes_type           on public.fragrance_notes(product_id, type);

-- ── product_tags ──────────────────────────────────────────────────────────────
create index idx_product_tags_product_id        on public.product_tags(product_id);
create index idx_product_tags_tag_id            on public.product_tags(tag_id);

-- ── inventory ────────────────────────────────────────────────────────────────
create index idx_inventory_variant_id           on public.inventory(variant_id);
create index idx_inventory_low_stock            on public.inventory(stock_quantity)
  where stock_quantity <= reorder_threshold and stock_quantity > 0;

-- ── inventory_movements ───────────────────────────────────────────────────────
create index idx_inventory_movements_variant    on public.inventory_movements(variant_id, created_at desc);
create index idx_inventory_movements_order      on public.inventory_movements(order_id);

-- ── orders ────────────────────────────────────────────────────────────────────
create index idx_orders_user_id                 on public.orders(user_id, created_at desc);
create index idx_orders_order_number            on public.orders(order_number);
create index idx_orders_status                  on public.orders(status);
create index idx_orders_payment_status          on public.orders(payment_status);
create index idx_orders_created_at              on public.orders(created_at desc);
create index idx_orders_coupon_id               on public.orders(coupon_id) where coupon_id is not null;

-- ── order_items ───────────────────────────────────────────────────────────────
create index idx_order_items_order_id           on public.order_items(order_id);
create index idx_order_items_variant_id         on public.order_items(variant_id);
create index idx_order_items_product_id         on public.order_items(product_id);

-- ── order_status_history ──────────────────────────────────────────────────────
create index idx_order_status_history_order_id  on public.order_status_history(order_id, created_at desc);

-- ── coupons ───────────────────────────────────────────────────────────────────
create index idx_coupons_code                   on public.coupons(code);      -- citext = case-insensitive
create index idx_coupons_status                 on public.coupons(status);

-- ── coupon_usages ─────────────────────────────────────────────────────────────
create index idx_coupon_usages_coupon_user      on public.coupon_usages(coupon_id, user_id);

-- ── carts ────────────────────────────────────────────────────────────────────
create index idx_carts_user_id                  on public.carts(user_id) where user_id is not null;
create index idx_carts_session_token            on public.carts(session_token) where session_token is not null;

-- ── cart_items ────────────────────────────────────────────────────────────────
create index idx_cart_items_cart_id             on public.cart_items(cart_id);

-- ── payments ─────────────────────────────────────────────────────────────────
create index idx_payments_order_id              on public.payments(order_id);
create index idx_payments_status                on public.payments(status);
create index idx_payments_provider_ref          on public.payments(provider_reference) where provider_reference is not null;

-- ── profiles ─────────────────────────────────────────────────────────────────
create index idx_profiles_email                 on public.profiles(email);
create index idx_profiles_role                  on public.profiles(role);

-- ── shipping / billing addresses ──────────────────────────────────────────────
create index idx_shipping_addresses_user_id     on public.shipping_addresses(user_id);
create index idx_billing_addresses_user_id      on public.billing_addresses(user_id);

-- ── wishlists ─────────────────────────────────────────────────────────────────
create index idx_wishlist_items_wishlist_id     on public.wishlist_items(wishlist_id);
create index idx_wishlist_items_product_id      on public.wishlist_items(product_id);

-- ── reviews ───────────────────────────────────────────────────────────────────
create index idx_reviews_product_id_status      on public.reviews(product_id, status);
create index idx_reviews_user_id                on public.reviews(user_id);

-- ── newsletter ────────────────────────────────────────────────────────────────
create index idx_newsletter_email               on public.newsletter_subscribers(email);
create index idx_newsletter_status             on public.newsletter_subscribers(status);

-- ── contact_messages ─────────────────────────────────────────────────────────
create index idx_contact_messages_status        on public.contact_messages(status, created_at desc);

-- ── audit_logs ────────────────────────────────────────────────────────────────
create index idx_audit_logs_admin_id            on public.audit_logs(admin_id, created_at desc);
create index idx_audit_logs_table_record        on public.audit_logs(table_name, record_id);
create index idx_audit_logs_created_at          on public.audit_logs(created_at desc);

-- ── site_settings ─────────────────────────────────────────────────────────────
create index idx_site_settings_public           on public.site_settings(is_public) where is_public = true;


-- =============================================================================
-- END OF MIGRATION
-- Schema version: 20260705000000
-- Tables:  profiles, admin_users, categories, tags, products, product_variants,
--          product_images, fragrance_notes, product_tags, inventory,
--          inventory_movements, shipping_addresses, billing_addresses, coupons,
--          carts, cart_items, orders, order_items, order_status_history,
--          coupon_usages, payments, wishlists, wishlist_items, reviews,
--          review_votes, newsletter_subscribers, contact_messages,
--          audit_logs, site_settings
-- Views:   storefront_products, admin_order_summary,
--          admin_inventory_status, admin_revenue_overview
-- =============================================================================
