-- MantaViews - Phase 3: least-privilege grants, RLS and Storage policies

-- New API objects are private by default. Every client grant must be explicit.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

-- Security-definer helpers live outside exposed API schemas.
grant usage on schema private to anon, authenticated, service_role;

-- The auth trigger needs elevated access, but must not live in an exposed schema.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Usuario'
  );

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_name, 80))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop function public.handle_new_user();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

-- Public wrapper is invoker-safe and only returns a boolean.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function private.get_place_stats()
returns table (
  place_id uuid,
  average_rating numeric(3, 2),
  review_count bigint,
  touristic_yes_count bigint,
  touristic_no_count bigint,
  touristic_percentage numeric,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    coalesce(r.average_rating, 0)::numeric(3, 2),
    coalesce(r.review_count, 0)::bigint,
    coalesce(v.touristic_yes_count, 0)::bigint,
    coalesce(v.touristic_no_count, 0)::bigint,
    case
      when coalesce(v.total_votes, 0) = 0 then 0::numeric
      else round((v.touristic_yes_count::numeric / v.total_votes::numeric) * 100, 2)
    end,
    coalesce(f.favorite_count, 0)::bigint
  from public.places p
  left join lateral (
    select avg(rv.rating)::numeric(3, 2) as average_rating, count(*)::bigint as review_count
    from public.reviews rv
    where rv.place_id = p.id and rv.status = 'published'
  ) r on true
  left join lateral (
    select
      count(*) filter (where tv.is_touristic)::bigint as touristic_yes_count,
      count(*) filter (where not tv.is_touristic)::bigint as touristic_no_count,
      count(*)::bigint as total_votes
    from public.tourist_votes tv
    where tv.place_id = p.id
  ) v on true
  left join lateral (
    select count(*)::bigint as favorite_count
    from public.favorites fav
    where fav.place_id = p.id
  ) f on true
  where p.status = 'published';
$$;

revoke all on function private.get_place_stats() from public;
grant execute on function private.get_place_stats() to anon, authenticated, service_role;

create or replace view public.place_stats
with (security_invoker = true)
as
select
  place_id,
  average_rating::numeric(3, 2) as average_rating,
  review_count,
  touristic_yes_count,
  touristic_no_count,
  touristic_percentage,
  favorite_count
from private.get_place_stats();

create or replace function private.get_public_profiles()
returns table (id uuid, display_name varchar, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_path
  from public.profiles p;
$$;

revoke all on function private.get_public_profiles() from public;
grant execute on function private.get_public_profiles() to anon, authenticated, service_role;

create or replace view public.public_profiles
with (security_invoker = true)
as
select * from private.get_public_profiles();

revoke all on public.place_stats from public, anon, authenticated;
revoke all on public.public_profiles from public, anon, authenticated;
grant select on public.place_stats to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- Explicit RLS even when the project-level automatic RLS option is enabled.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.places enable row level security;
alter table public.place_translations enable row level security;
alter table public.reviews enable row level security;
alter table public.place_images enable row level security;
alter table public.favorites enable row level security;
alter table public.tourist_votes enable row level security;
alter table public.user_interests enable row level security;
alter table public.place_suggestions enable row level security;
alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Remove inherited/default client access before adding the intended surface.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.place_stats, public.public_profiles to anon, authenticated;
grant select on public.categories, public.category_translations to anon, authenticated;
grant select on public.places, public.place_translations to anon, authenticated;
grant select on public.reviews, public.place_images to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_path, preferred_language) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.categories, public.category_translations to authenticated;
grant insert, update, delete on public.places, public.place_translations to authenticated;
grant insert, update, delete on public.reviews, public.place_images to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.tourist_votes to authenticated;
grant select on public.user_interests to anon;
grant select, insert, update, delete on public.user_interests to authenticated;
grant select, insert, update on public.place_suggestions, public.reports to authenticated;
grant select on public.admin_audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on function public.search_places(text, smallint, varchar, integer, integer) to anon, authenticated, service_role;
grant execute on function public.nearby_places(double precision, double precision, integer, smallint, varchar, integer) to anon, authenticated, service_role;
grant execute on function public.get_place_detail(uuid, varchar) to anon, authenticated, service_role;
grant execute on function public.get_recommendations(varchar, double precision, double precision, integer) to anon, authenticated, service_role;

-- Profiles: the base row is private; public fields are exposed by public_profiles.
create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_admin_all
on public.profiles for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy user_roles_select_own
on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_roles_admin_select
on public.user_roles for select to authenticated
using ((select private.is_admin()));

-- Catalog and published-place reads.
create policy categories_read_active
on public.categories for select to anon, authenticated
using (is_active);

create policy categories_admin_all
on public.categories for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy category_translations_read_active
on public.category_translations for select to anon, authenticated
using (
  exists (
    select 1 from public.categories c
    where c.id = category_id and c.is_active
  )
);

create policy category_translations_admin_all
on public.category_translations for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy places_read_published
on public.places for select to anon, authenticated
using (status = 'published');

create policy places_admin_all
on public.places for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy place_translations_read_published
on public.place_translations for select to anon, authenticated
using (
  exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy place_translations_admin_all
on public.place_translations for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Reviews: public published content; users control only their own review.
create policy reviews_read_published
on public.reviews for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy reviews_select_own
on public.reviews for select to authenticated
using ((select auth.uid()) = user_id);

create policy reviews_insert_own
on public.reviews for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'published'
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy reviews_update_own
on public.reviews for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and status in ('published', 'archived')
);

create policy reviews_admin_all
on public.reviews for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Image metadata: uploads start pending and users cannot make covers or publish.
create policy place_images_read_published
on public.place_images for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy place_images_select_own
on public.place_images for select to authenticated
using ((select auth.uid()) = uploader_id);

create policy place_images_insert_own_pending
on public.place_images for insert to authenticated
with check (
  (select auth.uid()) = uploader_id
  and status = 'pending'
  and not is_cover
  and split_part(storage_path, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy place_images_update_own_pending
on public.place_images for update to authenticated
using ((select auth.uid()) = uploader_id and status = 'pending')
with check (
  (select auth.uid()) = uploader_id
  and status = 'pending'
  and not is_cover
  and split_part(storage_path, '/', 1) = (select auth.uid())::text
);

create policy place_images_delete_own_pending
on public.place_images for delete to authenticated
using ((select auth.uid()) = uploader_id and status = 'pending');

create policy place_images_admin_all
on public.place_images for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Private per-user resources.
create policy favorites_select_own
on public.favorites for select to authenticated
using ((select auth.uid()) = user_id);

create policy favorites_insert_own
on public.favorites for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy favorites_delete_own
on public.favorites for delete to authenticated
using ((select auth.uid()) = user_id);

create policy tourist_votes_select_own
on public.tourist_votes for select to authenticated
using ((select auth.uid()) = user_id);

create policy tourist_votes_insert_own
on public.tourist_votes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.places p
    where p.id = place_id and p.status = 'published'
  )
);

create policy tourist_votes_update_own
on public.tourist_votes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy tourist_votes_delete_own
on public.tourist_votes for delete to authenticated
using ((select auth.uid()) = user_id);

create policy user_interests_select_own
on public.user_interests for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_interests_insert_own
on public.user_interests for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy user_interests_update_own
on public.user_interests for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_interests_delete_own
on public.user_interests for delete to authenticated
using ((select auth.uid()) = user_id);

-- Suggestions and reports are visible to their author and to administrators.
create policy place_suggestions_select_own
on public.place_suggestions for select to authenticated
using ((select auth.uid()) = submitted_by);

create policy place_suggestions_insert_own
on public.place_suggestions for insert to authenticated
with check (
  (select auth.uid()) = submitted_by
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

create policy place_suggestions_admin_all
on public.place_suggestions for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy reports_select_own
on public.reports for select to authenticated
using ((select auth.uid()) = reporter_id);

create policy reports_insert_own
on public.reports for insert to authenticated
with check (
  (select auth.uid()) = reporter_id
  and status = 'open'
  and reviewed_by is null
  and resolved_at is null
);

create policy reports_admin_all
on public.reports for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy admin_audit_logs_admin_select
on public.admin_audit_logs for select to authenticated
using ((select private.is_admin()));

-- Storage buckets: paths are UUID-based and always begin with the uploader UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'place-images',
    'place-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'avatars');

create policy avatars_insert_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy avatars_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy avatars_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy place_images_storage_read_published
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'place-images'
  and exists (
    select 1
    from public.place_images pi
    join public.places p on p.id = pi.place_id
    where pi.storage_path = name
      and pi.status = 'published'
      and p.status = 'published'
  )
);

create policy place_images_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy place_images_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy place_images_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy place_images_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
);

create policy mantaviews_storage_admin_all
on storage.objects for all to authenticated
using (
  bucket_id in ('avatars', 'place-images')
  and (select private.is_admin())
)
with check (
  bucket_id in ('avatars', 'place-images')
  and (select private.is_admin())
);

comment on function private.is_admin() is 'Security-definer role lookup kept outside exposed API schemas.';
comment on function private.get_place_stats() is 'Returns only non-identifying aggregates for published places.';
comment on view public.public_profiles is 'Public-safe user fields only; private profile fields remain protected by RLS.';
