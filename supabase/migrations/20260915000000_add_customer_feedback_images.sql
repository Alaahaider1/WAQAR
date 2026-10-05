create table public.customer_feedback_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null unique,
  position integer not null default 0 check (position >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_customer_feedback_images_updated_at
  before update on public.customer_feedback_images
  for each row execute function public.set_updated_at();

alter table public.customer_feedback_images enable row level security;

create policy customer_feedback_images_select_visible
  on public.customer_feedback_images for select
  using (is_visible or public.is_admin());

create policy customer_feedback_images_insert_admin
  on public.customer_feedback_images for insert
  with check (public.is_admin());

create policy customer_feedback_images_update_admin
  on public.customer_feedback_images for update
  using (public.is_admin()) with check (public.is_admin());

create policy customer_feedback_images_delete_admin
  on public.customer_feedback_images for delete
  using (public.is_admin());

create index idx_customer_feedback_images_visible_position
  on public.customer_feedback_images(position, created_at) where is_visible;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-feedback',
  'customer-feedback',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy customer_feedback_storage_read_public
  on storage.objects for select using (bucket_id = 'customer-feedback');

create policy customer_feedback_storage_insert_admin
  on storage.objects for insert
  with check (bucket_id = 'customer-feedback' and public.is_admin());

create policy customer_feedback_storage_update_admin
  on storage.objects for update
  using (bucket_id = 'customer-feedback' and public.is_admin())
  with check (bucket_id = 'customer-feedback' and public.is_admin());

create policy customer_feedback_storage_delete_admin
  on storage.objects for delete
  using (bucket_id = 'customer-feedback' and public.is_admin());
