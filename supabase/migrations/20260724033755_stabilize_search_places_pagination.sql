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
    order by pi.created_at, pi.id
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
  order by
    relevance desc,
    ps.average_rating desc,
    coalesce(p.published_at, p.created_at) desc,
    p.id
  limit p_limit offset p_offset;
end;
$$;

revoke all on function public.search_places(text, smallint, varchar, integer, integer)
from public;

grant execute on function public.search_places(text, smallint, varchar, integer, integer)
to anon, authenticated;
