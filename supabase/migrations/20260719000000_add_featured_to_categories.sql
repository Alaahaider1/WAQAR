alter table public.categories
  add column if not exists is_featured boolean not null default false;

comment on column public.categories.is_featured is
  'Whether this category should appear in the homepage featured collections';

create index if not exists idx_categories_featured
  on public.categories (is_featured, position)
  where is_active = true and is_featured = true;
