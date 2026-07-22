-- Phase 10: deterministic, explainable and category-diverse recommendations.
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
security invoker
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
    origin := extensions.st_setsrid(
      extensions.st_point(p_longitude, p_latitude),
      4326
    )::extensions.geography;
  end if;

  return query
  with scored as (
    select
      p.id,
      p.category_id,
      c.slug,
      coalesce(tr.name, es.name) as translated_name,
      coalesce(tr.short_description, es.short_description) as translated_short_description,
      extensions.st_y(p.location::extensions.geometry) as lat,
      extensions.st_x(p.location::extensions.geometry) as lon,
      ps.average_rating,
      ps.review_count,
      ps.favorite_count,
      coalesce(ui.weight, 0) as interest_weight,
      case when origin is null then null else extensions.st_distance(p.location, origin) end as distance_meters,
      (
        coalesce(ui.weight, 0)::numeric * 2.5
        + ps.average_rating::numeric * 2.0
        + least(ps.review_count, 20)::numeric * 0.10
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
      on ui.category_id = p.category_id and ui.user_id = (select auth.uid())
    left join lateral (
      select pi.storage_path
      from public.place_images pi
      where pi.place_id = p.id and pi.status = 'published' and pi.is_cover
      order by pi.created_at
      limit 1
    ) cover on true
    where p.status = 'published'
  ), diversified as (
    select
      scored.*,
      row_number() over (
        partition by scored.category_id
        order by scored.calculated_score desc, scored.average_rating desc, scored.id
      ) as category_rank
    from scored
  )
  select
    diversified.id,
    diversified.category_id,
    diversified.slug,
    diversified.translated_name,
    diversified.translated_short_description,
    diversified.lat,
    diversified.lon,
    diversified.average_rating,
    diversified.calculated_score,
    case
      when diversified.interest_weight > 0 then
        case when p_locale = 'en' then 'Matches your interests' else 'Coincide con tus intereses' end
      when diversified.distance_meters is not null and diversified.distance_meters <= 3000 then
        case when p_locale = 'en' then 'Near your current location' else 'Cerca de tu ubicación actual' end
      when diversified.average_rating >= 4 and diversified.review_count > 0 then
        case when p_locale = 'en' then 'Highly rated by visitors' else 'Muy valorado por visitantes' end
      when diversified.favorite_count > 0 then
        case when p_locale = 'en' then 'Popular among MantaViews users' else 'Popular entre usuarios de MantaViews' end
      else
        case when p_locale = 'en' then 'Discover more of Manta' else 'Descubre más de Manta' end
    end,
    diversified.storage_path
  from diversified
  order by diversified.category_rank, diversified.calculated_score desc, diversified.average_rating desc, diversified.id
  limit p_limit;
end;
$$;

revoke all on function public.get_recommendations(varchar, double precision, double precision, integer) from public;
grant execute on function public.get_recommendations(varchar, double precision, double precision, integer)
  to anon, authenticated, service_role;

comment on function public.get_recommendations(varchar, double precision, double precision, integer)
  is 'Deterministic recommendations using interests, rating, popularity, optional distance and category round-robin diversity.';
