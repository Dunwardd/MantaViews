-- MantaViews - Phase 2: core database schema
-- This migration is the source of truth for the project database.

create schema if not exists extensions;
create schema if not exists private;

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

revoke all on schema private from public;

create type public.app_role as enum ('user', 'admin');

create type public.content_status as enum (
  'pending',
  'published',
  'rejected',
  'archived'
);

create type public.report_target as enum ('place', 'review', 'image');

create type public.report_reason as enum (
  'incorrect_information',
  'duplicate',
  'inappropriate',
  'spam',
  'other'
);

create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name varchar(80) not null check (char_length(btrim(display_name)) between 2 and 80),
  avatar_path text check (avatar_path is null or char_length(avatar_path) between 1 and 500),
  preferred_language varchar(2) not null default 'es' check (preferred_language in ('es', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id) on delete set null
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug varchar(50) not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  icon varchar(50) not null check (icon ~ '^[a-z0-9-]+$'),
  color varchar(7) not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order smallint not null default 0 check (sort_order >= 0),
  is_active boolean not null default true
);

create table public.category_translations (
  category_id smallint not null references public.categories (id) on delete cascade,
  locale varchar(2) not null check (locale in ('es', 'en')),
  name varchar(80) not null check (char_length(btrim(name)) between 2 and 80),
  primary key (category_id, locale)
);

create table public.places (
  id uuid primary key default extensions.gen_random_uuid(),
  category_id smallint not null references public.categories (id),
  created_by uuid references auth.users (id) on delete set null,
  status public.content_status not null default 'pending',
  location extensions.geography(Point, 4326) not null,
  address varchar(250) not null check (char_length(btrim(address)) between 3 and 250),
  phone varchar(30) check (phone is null or char_length(btrim(phone)) between 7 and 30),
  website_url text check (website_url is null or website_url ~* '^https://[^[:space:]]+$'),
  opening_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(opening_hours) = 'object'),
  price_level smallint check (price_level between 0 and 4),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.place_translations (
  place_id uuid not null references public.places (id) on delete cascade,
  locale varchar(2) not null check (locale in ('es', 'en')),
  name varchar(150) not null check (char_length(btrim(name)) between 2 and 150),
  short_description varchar(280) not null check (char_length(btrim(short_description)) between 10 and 280),
  description text not null check (char_length(btrim(description)) between 20 and 5000),
  primary key (place_id, locale)
);

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment varchar(1000) not null check (char_length(btrim(comment)) between 3 and 1000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, user_id),
  unique (id, place_id)
);

create table public.place_images (
  id uuid primary key default extensions.gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  review_id uuid,
  uploader_id uuid references public.profiles (id) on delete set null,
  storage_path text not null unique check (char_length(storage_path) between 3 and 500),
  alt_text varchar(180) not null check (char_length(btrim(alt_text)) between 3 and 180),
  status public.content_status not null default 'pending',
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (review_id, place_id)
    references public.reviews (id, place_id)
    on delete cascade
);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.tourist_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  is_touristic boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id smallint not null references public.categories (id) on delete cascade,
  weight smallint not null default 1 check (weight between 1 and 5),
  primary key (user_id, category_id)
);

create table public.place_suggestions (
  id uuid primary key default extensions.gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  category_id smallint not null references public.categories (id),
  location extensions.geography(Point, 4326) not null,
  name varchar(150) not null check (char_length(btrim(name)) between 2 and 150),
  description varchar(1500) not null check (char_length(btrim(description)) between 20 and 1500),
  address varchar(250) not null check (char_length(btrim(address)) between 3 and 250),
  evidence_url text check (evidence_url is null or evidence_url ~* '^https://[^[:space:]]+$'),
  status public.content_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  review_notes varchar(500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (
    (reviewed_at is null and reviewed_by is null)
    or (reviewed_at is not null and reviewed_by is not null)
  )
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details varchar(500) check (details is null or char_length(btrim(details)) between 3 and 500),
  status public.report_status not null default 'open',
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (
    (status = 'open' and resolved_at is null)
    or (status <> 'open' and resolved_at is not null)
  )
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users (id),
  action varchar(80) not null check (action ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  target_type varchar(40) not null check (target_type ~ '^[a-z][a-z0-9_-]{1,39}$'),
  target_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index places_location_gix on public.places using gist (location);
create index places_status_category_idx on public.places (status, category_id);
create index places_featured_idx on public.places (is_featured, published_at desc)
  where status = 'published';
create index reviews_place_status_idx on public.reviews (place_id, status, created_at desc);
create index place_images_place_status_idx on public.place_images (place_id, status, created_at);
create index favorites_place_idx on public.favorites (place_id);
create index tourist_votes_place_idx on public.tourist_votes (place_id, is_touristic);
create index user_interests_category_idx on public.user_interests (category_id);
create index suggestions_status_created_idx on public.place_suggestions (status, created_at desc);
create index reports_status_created_idx on public.reports (status, created_at desc);
create index place_translations_name_trgm_idx
  on public.place_translations using gin (name extensions.gin_trgm_ops);

create unique index one_published_cover_per_place
  on public.place_images (place_id)
  where is_cover = true and status = 'published';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.sync_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger places_set_updated_at
before update on public.places
for each row execute function private.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function private.set_updated_at();

create trigger tourist_votes_set_updated_at
before update on public.tourist_votes
for each row execute function private.set_updated_at();

create trigger places_sync_published_at
before insert or update of status, published_at on public.places
for each row execute function private.sync_published_at();

create or replace function public.handle_new_user()
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

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

comment on schema private is 'Internal database helpers. Never expose through the Data API.';
comment on table public.user_roles is 'Protected authorization roles; clients must never assign their own role.';
comment on column public.places.location is 'Longitude first, latitude second: ST_Point(longitude, latitude).';
comment on table public.admin_audit_logs is 'Append-only log populated by trusted administrative backend code.';
