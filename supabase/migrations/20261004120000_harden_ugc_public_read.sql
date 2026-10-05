-- Storefront visitors can read only the fields needed to render visible videos.
-- Storage paths and audit timestamps remain available only to server-side
-- service-role operations after requireAdmin() has succeeded.
revoke select on public.ugc_videos from public, anon, authenticated;
grant select (video_url, customer_name, caption, position, is_visible)
  on public.ugc_videos to anon, authenticated;
