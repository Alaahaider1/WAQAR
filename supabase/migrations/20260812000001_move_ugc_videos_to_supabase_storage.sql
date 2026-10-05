-- Keep the existing UGC table and records, but make its storage reference provider-neutral.
alter table public.ugc_videos rename column cloudinary_id to storage_path;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ugc-videos',
  'ugc-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy ugc_videos_storage_read_public
  on storage.objects for select
  using (bucket_id = 'ugc-videos');

create policy ugc_videos_storage_insert_admin
  on storage.objects for insert
  with check (bucket_id = 'ugc-videos' and public.is_admin());

create policy ugc_videos_storage_update_admin
  on storage.objects for update
  using (bucket_id = 'ugc-videos' and public.is_admin())
  with check (bucket_id = 'ugc-videos' and public.is_admin());

create policy ugc_videos_storage_delete_admin
  on storage.objects for delete
  using (bucket_id = 'ugc-videos' and public.is_admin());
