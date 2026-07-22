alter table public.places
  add column source_name varchar(120),
  add column source_url text,
  add column source_checked_at timestamptz;

alter table public.places
  add constraint places_source_url_check
  check (source_url is null or source_url ~* '^https://[^[:space:]]+$');

alter table public.place_images
  add column source_url text,
  add column attribution_text varchar(300),
  add column license_name varchar(80),
  add column license_url text;

alter table public.place_images
  add constraint place_images_source_url_check
  check (source_url is null or source_url ~* '^https://[^[:space:]]+$'),
  add constraint place_images_license_url_check
  check (license_url is null or license_url ~* '^https://[^[:space:]]+$');
