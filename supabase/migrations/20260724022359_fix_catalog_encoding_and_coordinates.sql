-- Repair catalog text that was imported as Windows-1252 after being encoded as UTF-8.
-- The predicate keeps already-correct text untouched and limits the repair to catalog data.
update public.places
set address = convert_from(convert_to(address, 'WIN1252'), 'UTF8'),
    updated_at = now()
where address ~ '[ÃÂâ]';

update public.place_translations
set name = case
      when name ~ '[ÃÂâ]' then convert_from(convert_to(name, 'WIN1252'), 'UTF8')
      else name
    end,
    short_description = case
      when short_description ~ '[ÃÂâ]' then convert_from(convert_to(short_description, 'WIN1252'), 'UTF8')
      else short_description
    end,
    description = case
      when description ~ '[ÃÂâ]' then convert_from(convert_to(description, 'WIN1252'), 'UTF8')
      else description
    end
where locale in ('es', 'en')
  and (
    name ~ '[ÃÂâ]'
    or short_description ~ '[ÃÂâ]'
    or description ~ '[ÃÂâ]'
  );

update public.category_translations
set name = convert_from(convert_to(name, 'WIN1252'), 'UTF8')
where locale = 'es'
  and name ~ '[ÃÂâ]';

update public.place_images
set alt_text = convert_from(convert_to(alt_text, 'WIN1252'), 'UTF8')
where alt_text ~ '[ÃÂâ]';

-- Corrales Marinos de Ligüiqui:
-- OpenStreetMap node 12063941542: -1.0242643, -80.8818311.
update public.places
set location = extensions.st_setsrid(
      extensions.st_point(-80.8818311, -1.0242643),
      4326
    )::extensions.geography,
    address = 'Ligüiqui, Manta, Manabí',
    source_name = 'OpenStreetMap',
    source_url = 'https://www.openstreetmap.org/node/12063941542',
    source_checked_at = '2026-07-24T00:00:00Z'::timestamptz,
    updated_at = now()
where id = '10000000-0000-4000-8000-000000000040'::uuid;

-- Wyndham Manta Sail Plaza:
-- OpenStreetMap way 850651516 centroid: -0.9457280, -80.7507423.
-- Wyndham's official address is Vía a Barbasquillo km 1.7.
update public.places
set location = extensions.st_setsrid(
      extensions.st_point(-80.7507423, -0.9457280),
      4326
    )::extensions.geography,
    address = 'Vía a Barbasquillo km 1,7, Manta, Manabí',
    source_name = 'OpenStreetMap',
    source_url = 'https://www.openstreetmap.org/way/850651516',
    source_checked_at = '2026-07-24T00:00:00Z'::timestamptz,
    updated_at = now()
where id = '10000000-0000-4000-8000-000000000031'::uuid;
