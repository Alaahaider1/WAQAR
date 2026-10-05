create table public.ugc_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  cloudinary_id text not null unique,
  customer_name text,
  caption text,
  position integer not null default 0 check (position >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_ugc_videos_updated_at before update on public.ugc_videos
  for each row execute function public.set_updated_at();

alter table public.ugc_videos enable row level security;
create policy ugc_videos_select_visible on public.ugc_videos for select using (is_visible or public.is_admin());
create policy ugc_videos_insert_admin on public.ugc_videos for insert with check (public.is_admin());
create policy ugc_videos_update_admin on public.ugc_videos for update using (public.is_admin()) with check (public.is_admin());
create policy ugc_videos_delete_admin on public.ugc_videos for delete using (public.is_admin());
create index idx_ugc_videos_visible_position on public.ugc_videos(position, created_at) where is_visible;
