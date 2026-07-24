do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'categories',
    'category_translations',
    'place_images',
    'place_suggestions',
    'places',
    'profiles',
    'reports',
    'reviews'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_publication_tables publication_table
      where publication_table.pubname = 'supabase_realtime'
        and publication_table.schemaname = 'public'
        and publication_table.tablename = target_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        target_table
      );
    end if;
  end loop;
end
$$;
