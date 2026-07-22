begin;

select plan(18);

select has_extension('postgis', 'PostGIS is enabled');
select has_extension('pgcrypto', 'pgcrypto is enabled');
select has_extension('pg_trgm', 'pg_trgm is enabled');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'places', 'places table exists');
select has_table('public', 'reviews', 'reviews table exists');
select has_table('public', 'place_suggestions', 'place_suggestions table exists');
select has_table('public', 'admin_audit_logs', 'admin audit table exists');
select has_view('public', 'place_stats', 'place_stats view exists');

select has_function('public', 'search_places', array['text', 'smallint', 'character varying', 'integer', 'integer'], 'search RPC exists');
select has_function('public', 'nearby_places', array['double precision', 'double precision', 'integer', 'smallint', 'character varying', 'integer'], 'nearby RPC exists');
select has_function('public', 'get_place_detail', array['uuid', 'character varying'], 'detail RPC exists');
select has_function('public', 'get_recommendations', array['character varying', 'double precision', 'double precision', 'integer'], 'recommendation RPC exists');
select has_function('public', 'is_admin', array[]::text[], 'admin helper exists');

select results_eq(
  $$ select count(*)::bigint from public.categories $$,
  array[9::bigint],
  'nine tourism categories are seeded'
);

select results_eq(
  $$ select count(*)::bigint from public.category_translations $$,
  array[18::bigint],
  'all categories have Spanish and English translations'
);

insert into public.places (
  id,
  category_id,
  status,
  location,
  address,
  price_level
)
select
  '00000000-0000-0000-0000-000000000101'::uuid,
  id,
  'published',
  extensions.st_setsrid(extensions.st_point(-80.7284, -0.9431), 4326)::extensions.geography,
  'Dirección sintética para prueba, Manta',
  0
from public.categories
where slug = 'playas';

insert into public.place_translations (
  place_id,
  locale,
  name,
  short_description,
  description
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'es',
    'Lugar sintético de prueba',
    'Registro temporal utilizado solo por las pruebas de base de datos.',
    'Este registro se crea dentro de una transacción y nunca se conserva como dato turístico real.'
  ),
  (
    '00000000-0000-0000-0000-000000000101',
    'en',
    'Synthetic test place',
    'Temporary record used only by the database verification suite.',
    'This record is created inside a transaction and is never retained as real tourism data.'
  );

select results_eq(
  $$
    select count(*)::bigint
    from public.nearby_places(-0.9431, -80.7284, 1000, null, 'es', 20)
    where place_id = '00000000-0000-0000-0000-000000000101'::uuid
  $$,
  array[1::bigint],
  'nearby RPC finds the synthetic point at the supplied coordinates'
);

select ok(
  (
    select distance_meters < 1
    from public.nearby_places(-0.9431, -80.7284, 1000, null, 'es', 20)
    where place_id = '00000000-0000-0000-0000-000000000101'::uuid
  ),
  'nearby RPC returns a correct near-zero distance'
);

select * from finish();
rollback;
