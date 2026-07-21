-- MantaViews - Phase 2: aggregate view and read-only RPC functions

create or replace view public.place_stats
with (security_invoker = true)
as
select
  p.id as place_id,
  coalesce(r.average_rating, 0)::numeric(3, 2) as average_rating,
  coalesce(r.review_count, 0)::bigint as review_count,
  coalesce(v.touristic_yes_count, 0)::bigint as touristic_yes_count,
  coalesce(v.touristic_no_count, 0)::bigint as touristic_no_count,
  case
    when coalesce(v.total_votes, 0) = 0 then 0::numeric
    else round((v.touristic_yes_count::numeric / v.total_votes::numeric) * 100, 2)
  end as touristic_percentage,
  coalesce(f.favorite_count, 0)::bigint as favorite_count
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
) f on true;

revoke all on public.place_stats from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

create or replace function public.search_places(
  p_query text default null,
  p_category_id smallint default null,
  p_locale varchar default 'es',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  place_id uuid,
  category_id smallint,
  category_slug varchar,
  name varchar,
  short_description varchar,
  address varchar,
  latitude double precision,
  longitude double precision,
  average_rating numeric,
  review_count bigint,
  favorite_count bigint,
  cover_image_path text,
  relevance real
)
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_locale not in ('es', 'en') then
    raise exception 'locale must be es or en' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 50 then
    raise exception 'limit must be between 1 and 50' using errcode = '22023';
  end if;
  if p_offset < 0 or p_offset > 10000 then
    raise exception 'offset must be between 0 and 10000' using errcode = '22023';
  end if;
  if p_query is not null and char_length(btrim(p_query)) > 100 then
    raise exception 'query must contain at most 100 characters' using errcode = '22023';
  end if;

  return query
  select
    p.id,
    p.category_id,
    c.slug,
    coalesce(tr.name, es.name),
    coalesce(tr.short_description, es.short_description),
    p.address,
    extensions.st_y(p.location::extensions.geometry),
    extensions.st_x(p.location::extensions.geometry),
    ps.average_rating,
    ps.review_count,
    ps.favorite_count,
    cover.storage_path,
    case
      when nullif(btrim(p_query), '') is null then 1::real
      else greatest(
        extensions.similarity(coalesce(tr.name, es.name), btrim(p_query)),
        extensions.similarity(coalesce(tr.short_description, es.short_description), btrim(p_query))
      )
    end as relevance
  from public.places p
  join public.categories c on c.id = p.category_id and c.is_active
  left join public.place_translations tr on tr.place_id = p.id and tr.locale = p_locale
  join public.place_translations es on es.place_id = p.id and es.locale = 'es'
  join public.place_stats ps on ps.place_id = p.id
  left join lateral (
    select pi.storage_path
    from public.place_images pi
    where pi.place_id = p.id and pi.status = 'published' and pi.is_cover
    order by pi.created_at
    limit 1
  ) cover on true
  where p.status = 'published'
    and (p_category_id is null or p.category_id = p_category_id)
    and (
      nullif(btrim(p_query), '') is null
      or coalesce(tr.name, es.name) ilike '%' || btrim(p_query) || '%'
      or coalesce(tr.short_description, es.short_description) ilike '%' || btrim(p_query) || '%'
      or extensions.similarity(coalesce(tr.name, es.name), btrim(p_query)) >= 0.2
    )
  order by relevance desc, ps.average_rating desc, coalesce(p.published_at, p.created_at) desc
  limit p_limit offset p_offset;
end;
$$;

create or replace function public.nearby_places(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 10000,
  p_category_id smallint default null,
  p_locale varchar default 'es',
  p_limit integer default 20
)
returns table (
  place_id uuid,
  category_id smallint,
  category_slug varchar,
  name varchar,
  short_description varchar,
  address varchar,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  average_rating numeric,
  cover_image_path text
)
language plpgsql
stable
set search_path = ''
as $$
declare
  origin extensions.geography;
begin
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'invalid coordinates' using errcode = '22023';
  end if;
  if p_radius_meters < 100 or p_radius_meters > 50000 then
    raise exception 'radius must be between 100 and 50000 meters' using errcode = '22023';
  end if;
  if p_locale not in ('es', 'en') then
    raise exception 'locale must be es or en' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 50 then
    raise exception 'limit must be between 1 and 50' using errcode = '22023';
  end if;

  origin := extensions.st_setsrid(extensions.st_point(p_longitude, p_latitude), 4326)::extensions.geography;

  return query
  select
    p.id,
    p.category_id,
    c.slug,
    coalesce(tr.name, es.name),
    coalesce(tr.short_description, es.short_description),
    p.address,
    extensions.st_y(p.location::extensions.geometry),
    extensions.st_x(p.location::extensions.geometry),
    extensions.st_distance(p.location, origin),
    ps.average_rating,
    cover.storage_path
  from public.places p
  join public.categories c on c.id = p.category_id and c.is_active
  left join public.place_translations tr on tr.place_id = p.id and tr.locale = p_locale
  join public.place_translations es on es.place_id = p.id and es.locale = 'es'
  join public.place_stats ps on ps.place_id = p.id
  left join lateral (
    select pi.storage_path
    from public.place_images pi
    where pi.place_id = p.id and pi.status = 'published' and pi.is_cover
    order by pi.created_at
    limit 1
  ) cover on true
  where p.status = 'published'
    and (p_category_id is null or p.category_id = p_category_id)
    and extensions.st_dwithin(p.location, origin, p_radius_meters)
  order by extensions.st_distance(p.location, origin), ps.average_rating desc
  limit p_limit;
end;
$$;

create or replace function public.get_place_detail(
  p_place_id uuid,
  p_locale varchar default 'es'
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  result jsonb;
begin
  if p_locale not in ('es', 'en') then
    raise exception 'locale must be es or en' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'id', p.id,
    'category', jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', coalesce(ct.name, ces.name),
      'icon', c.icon,
      'color', c.color
    ),
    'name', coalesce(tr.name, es.name),
    'shortDescription', coalesce(tr.short_description, es.short_description),
    'description', coalesce(tr.description, es.description),
    'address', p.address,
    'latitude', extensions.st_y(p.location::extensions.geometry),
    'longitude', extensions.st_x(p.location::extensions.geometry),
    'phone', p.phone,
    'websiteUrl', p.website_url,
    'openingHours', p.opening_hours,
    'priceLevel', p.price_level,
    'isFeatured', p.is_featured,
    'publishedAt', p.published_at,
    'stats', jsonb_build_object(
      'averageRating', ps.average_rating,
      'reviewCount', ps.review_count,
      'touristicYesCount', ps.touristic_yes_count,
      'touristicNoCount', ps.touristic_no_count,
      'touristicPercentage', ps.touristic_percentage,
      'favoriteCount', ps.favorite_count
    ),
    'images', coalesce(images.items, '[]'::jsonb)
  )
  into result
  from public.places p
  join public.categories c on c.id = p.category_id and c.is_active
  left join public.category_translations ct on ct.category_id = c.id and ct.locale = p_locale
  join public.category_translations ces on ces.category_id = c.id and ces.locale = 'es'
  left join public.place_translations tr on tr.place_id = p.id and tr.locale = p_locale
  join public.place_translations es on es.place_id = p.id and es.locale = 'es'
  join public.place_stats ps on ps.place_id = p.id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', pi.id,
        'storagePath', pi.storage_path,
        'altText', pi.alt_text,
        'isCover', pi.is_cover
      ) order by pi.is_cover desc, pi.created_at
    ) as items
    from public.place_images pi
    where pi.place_id = p.id and pi.status = 'published'
  ) images on true
  where p.id = p_place_id and p.status = 'published';

  return result;
end;
$$;

create or replace function public.get_recommendations(
  p_locale varchar default 'es',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_limit integer default 10
)
returns table (
  place_id uuid,
  category_id smallint,
  category_slug varchar,
  name varchar,
  short_description varchar,
  latitude double precision,
  longitude double precision,
  average_rating numeric,
  score numeric,
  recommendation_reason text,
  cover_image_path text
)
language plpgsql
stable
set search_path = ''
as $$
declare
  origin extensions.geography;
begin
  if p_locale not in ('es', 'en') then
    raise exception 'locale must be es or en' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 30 then
    raise exception 'limit must be between 1 and 30' using errcode = '22023';
  end if;
  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'latitude and longitude must be provided together' using errcode = '22023';
  end if;
  if p_latitude is not null and (
    p_latitude not between -90 and 90 or p_longitude not between -180 and 180
  ) then
    raise exception 'invalid coordinates' using errcode = '22023';
  end if;

  if p_latitude is not null then
    origin := extensions.st_setsrid(extensions.st_point(p_longitude, p_latitude), 4326)::extensions.geography;
  end if;

  return query
  with ranked as (
    select
      p.id,
      p.category_id,
      c.slug,
      coalesce(tr.name, es.name) as translated_name,
      coalesce(tr.short_description, es.short_description) as translated_short_description,
      extensions.st_y(p.location::extensions.geometry) as lat,
      extensions.st_x(p.location::extensions.geometry) as lon,
      ps.average_rating,
      coalesce(ui.weight, 0) as interest_weight,
      (
        coalesce(ui.weight, 0)::numeric * 2.5
        + ps.average_rating::numeric * 2
        + least(ps.favorite_count, 20)::numeric * 0.15
        + case when p.is_featured then 1.5 else 0 end
        + case
            when origin is null then 0
            else greatest(0, 3 - extensions.st_distance(p.location, origin) / 5000.0)
          end
      )::numeric(10, 3) as calculated_score,
      cover.storage_path
    from public.places p
    join public.categories c on c.id = p.category_id and c.is_active
    left join public.place_translations tr on tr.place_id = p.id and tr.locale = p_locale
    join public.place_translations es on es.place_id = p.id and es.locale = 'es'
    join public.place_stats ps on ps.place_id = p.id
    left join public.user_interests ui
      on ui.category_id = p.category_id and ui.user_id = auth.uid()
    left join lateral (
      select pi.storage_path
      from public.place_images pi
      where pi.place_id = p.id and pi.status = 'published' and pi.is_cover
      order by pi.created_at
      limit 1
    ) cover on true
    where p.status = 'published'
  )
  select
    ranked.id,
    ranked.category_id,
    ranked.slug,
    ranked.translated_name,
    ranked.translated_short_description,
    ranked.lat,
    ranked.lon,
    ranked.average_rating,
    ranked.calculated_score,
    case
      when ranked.interest_weight > 0 then
        case when p_locale = 'en' then 'Matches your interests' else 'Coincide con tus intereses' end
      when ranked.average_rating >= 4 then
        case when p_locale = 'en' then 'Highly rated by visitors' else 'Muy valorado por visitantes' end
      else
        case when p_locale = 'en' then 'Popular in Manta' else 'Popular en Manta' end
    end,
    ranked.storage_path
  from ranked
  order by ranked.calculated_score desc, ranked.average_rating desc, ranked.id
  limit p_limit;
end;
$$;

revoke all on function public.search_places(text, smallint, varchar, integer, integer) from public;
revoke all on function public.nearby_places(double precision, double precision, integer, smallint, varchar, integer) from public;
revoke all on function public.get_place_detail(uuid, varchar) from public;
revoke all on function public.get_recommendations(varchar, double precision, double precision, integer) from public;

-- RPC access becomes useful after Phase 3 grants table access and defines RLS.
grant execute on function public.search_places(text, smallint, varchar, integer, integer) to anon, authenticated;
grant execute on function public.nearby_places(double precision, double precision, integer, smallint, varchar, integer) to anon, authenticated;
grant execute on function public.get_place_detail(uuid, varchar) to anon, authenticated;
grant execute on function public.get_recommendations(varchar, double precision, double precision, integer) to anon, authenticated;

comment on view public.place_stats is 'Safe aggregate model; underlying row visibility is governed by RLS in Phase 3.';
comment on function public.get_recommendations(varchar, double precision, double precision, integer)
  is 'Deterministic recommendation score; it does not require a paid AI service.';
