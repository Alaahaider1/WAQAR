-- The homepage previously displayed every active category because its query did
-- not apply is_featured. Preserve those existing storefront collections while
-- subsequent category visibility is controlled by the Admin "Featured" toggle.
update public.categories
set is_featured = true
where is_active = true
  and is_featured = false;
