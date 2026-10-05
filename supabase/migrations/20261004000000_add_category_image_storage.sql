insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'category_images_storage_read_public'
  ) then
    create policy category_images_storage_read_public
      on storage.objects for select
      using (bucket_id = 'category-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'category_images_storage_insert_admin'
  ) then
    create policy category_images_storage_insert_admin
      on storage.objects for insert
      with check (bucket_id = 'category-images' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'category_images_storage_update_admin'
  ) then
    create policy category_images_storage_update_admin
      on storage.objects for update
      using (bucket_id = 'category-images' and public.is_admin())
      with check (bucket_id = 'category-images' and public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'category_images_storage_delete_admin'
  ) then
    create policy category_images_storage_delete_admin
      on storage.objects for delete
      using (bucket_id = 'category-images' and public.is_admin());
  end if;
end
$$;
