begin;

select plan(42);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles', 'user_roles', 'categories', 'category_translations',
        'places', 'place_translations', 'reviews', 'place_images',
        'favorites', 'tourist_votes', 'user_interests', 'place_suggestions',
        'reports', 'admin_audit_logs'
      )
      and c.relrowsecurity
  $$,
  array[14::bigint],
  'RLS is enabled on every public application table'
);

select has_view('public', 'public_profiles', 'public profile projection exists');
select view_owner_is('public', 'public_profiles', 'postgres', 'public profile view has the expected owner');
select has_function('private', 'is_admin', array[]::text[], 'private admin helper exists');
select has_function('private', 'get_place_stats', array[]::text[], 'private aggregate helper exists');

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' $$,
  array[42::bigint],
  'all application RLS policies exist'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'storage' and policyname like '%mantaviews%' or schemaname = 'storage' and policyname like 'avatars_%' or schemaname = 'storage' and policyname like 'place_images_storage_%' $$,
  array[9::bigint],
  'all restricted MantaViews Storage policies exist without public avatar listing'
);

select results_eq(
  $$ select count(*)::bigint from storage.buckets where id in ('avatars', 'place-images') $$,
  array[2::bigint],
  'both image buckets exist'
);

select results_eq(
  $$ select count(*)::bigint from storage.buckets where id = 'avatars' and public $$,
  array[1::bigint],
  'avatar bucket is public'
);

select results_eq(
  $$ select count(*)::bigint from storage.buckets where id = 'place-images' and not public $$,
  array[1::bigint],
  'place image bucket is private'
);

select results_eq(
  $$ select count(*)::bigint from storage.buckets where id in ('avatars', 'place-images') and file_size_limit = 5242880 $$,
  array[2::bigint],
  'both buckets limit files to 5 MB'
);

select results_eq(
  $$
    select count(*)::bigint
    from storage.buckets
    where id in ('avatars', 'place-images')
      and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']::text[]
  $$,
  array[2::bigint],
  'both buckets allow only the required image MIME types'
);

select table_privs_are(
  'public', 'categories', 'anon', array['SELECT'],
  'anonymous role can only read categories'
);

select table_privs_are(
  'public', 'favorites', 'anon', array[]::text[],
  'anonymous role has no direct favorite access'
);

select table_privs_are(
  'public', 'user_roles', 'anon', array[]::text[],
  'anonymous role cannot access roles'
);

select table_privs_are(
  'public', 'profiles', 'authenticated', array['SELECT'],
  'authenticated users can select profiles subject to own-row RLS'
);

select column_privs_are(
  'public', 'profiles', 'display_name', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated users can update display name'
);

select table_privs_are(
  'public', 'user_roles', 'authenticated', array['SELECT'],
  'authenticated users cannot write roles'
);

select table_privs_are(
  'public', 'admin_audit_logs', 'authenticated', array['SELECT'],
  'authenticated users cannot write audit logs'
);

select function_privs_are(
  'private', 'is_admin', array[]::text[], 'anon', array[]::text[],
  'anonymous role cannot execute the admin helper'
);

select function_privs_are(
  'private', 'is_admin', array[]::text[], 'authenticated', array['EXECUTE'],
  'authenticated role may evaluate the admin helper for RLS'
);

set local role anon;

select results_eq(
  $$ select count(*)::bigint from public.categories $$,
  array[9::bigint],
  'anonymous users can read active categories'
);

select results_eq(
  $$ select count(*)::bigint from public.category_translations $$,
  array[18::bigint],
  'anonymous users can read category translations'
);

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot read private profile rows'
);

select lives_ok(
  $$ select * from public.public_profiles $$,
  'anonymous users can read the safe public profile projection'
);

select throws_ok(
  $$ select * from public.favorites $$,
  '42501',
  'permission denied for table favorites',
  'anonymous users cannot read favorites'
);

select throws_ok(
  $$ select public.is_admin() $$,
  '42501',
  'permission denied for function is_admin',
  'anonymous users cannot call the admin RPC'
);

select lives_ok(
  $$ select * from public.search_places(null, null, 'es', 20, 0) $$,
  'public search RPC remains callable after RLS'
);

select lives_ok(
  $$ select * from public.nearby_places(-0.9431, -80.7284, 1000, null, 'es', 20) $$,
  'public nearby RPC remains callable after RLS'
);

reset role;

-- Runtime isolation checks with two regular users and one administrator.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'user-a@example.test', '{"display_name":"Usuario A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'user-b@example.test', '{"display_name":"Usuario B"}'::jsonb),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin@example.test', '{"display_name":"Admin"}'::jsonb);

insert into public.places (id, category_id, status, location, address)
select
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  id,
  'published',
  extensions.st_setsrid(extensions.st_point(-80.7284, -0.9431), 4326)::extensions.geography,
  'Lugar de prueba'
from public.categories
where slug = 'playas';

select results_eq(
  $$ select count(*)::bigint from public.profiles where id in (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ) $$,
  array[3::bigint],
  'the private auth trigger provisions profiles for all test users'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
set local role authenticated;

select results_eq(
  $$ select count(*)::bigint from public.profiles $$,
  array[1::bigint],
  'user A can only read their own private profile'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Usuario A actualizado' where id = auth.uid() $$,
  'user A can update an allowed field on their own profile'
);

select lives_ok(
  $$ insert into public.favorites (user_id, place_id) values (
    auth.uid(), 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ) $$,
  'user A can create their own favorite'
);

select results_eq(
  $$ select count(*)::bigint from public.favorites $$,
  array[1::bigint],
  'user A can read their own favorite'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);

select results_eq(
  $$ select count(*)::bigint from public.profiles $$,
  array[1::bigint],
  'user B cannot read user A private profile'
);

select results_eq(
  $$ select count(*)::bigint from public.favorites $$,
  array[0::bigint],
  'user B cannot read user A favorite'
);

reset role;
update public.user_roles
set role = 'admin'
where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
set local role authenticated;

select results_eq(
  $$ select private.is_admin() $$,
  array[true],
  'the administrator is recognized by the private authorization helper'
);

select results_eq(
  $$ select count(*)::bigint from public.profiles $$,
  array[3::bigint],
  'the administrator can read all private profiles'
);

select lives_ok(
  $$ insert into public.categories (slug, icon, color, sort_order)
     values ('categoria-admin-test', 'shield', '#006D77', 999) $$,
  'the administrator can create managed catalog content'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.routines
    where routine_schema = 'private'
      and routine_name = 'handle_new_user'
      and security_type = 'DEFINER'
  $$,
  array[1::bigint],
  'the auth trigger function is private and security definer'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('user_roles', 'admin_audit_logs')
      and grantee = 'authenticated'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  $$,
  array[0::bigint],
  'protected authorization tables have no client write grants'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.routines
    where routine_schema = 'public'
      and security_type = 'DEFINER'
  $$,
  array[0::bigint],
  'no public API function uses security definer'
);

select * from finish();
rollback;
