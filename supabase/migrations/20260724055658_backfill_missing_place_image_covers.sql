with missing_cover as (
  select distinct on (image.place_id)
    image.id
  from public.place_images image
  where image.status = 'published'
    and not exists (
      select 1
      from public.place_images cover
      where cover.place_id = image.place_id
        and cover.status = 'published'
        and cover.is_cover
    )
  order by image.place_id, image.created_at, image.id
)
update public.place_images image
set is_cover = true
from missing_cover
where image.id = missing_cover.id;
