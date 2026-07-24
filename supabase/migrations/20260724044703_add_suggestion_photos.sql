alter table public.place_suggestions
  add column image_storage_path text;

alter table public.place_suggestions
  add constraint place_suggestions_image_storage_path_key unique (image_storage_path),
  add constraint place_suggestions_image_storage_path_check check (
    image_storage_path is null
    or (
      char_length(image_storage_path) between 3 and 500
      and image_storage_path ~ '^[0-9a-f-]{36}/suggestions/[0-9]+-[a-z0-9]{8}\.jpg$'
    )
  );

drop policy place_suggestions_insert_own on public.place_suggestions;

create policy place_suggestions_insert_own
on public.place_suggestions for insert to authenticated
with check (
  (select auth.uid()) = submitted_by
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and (
    image_storage_path is null
    or (
      split_part(image_storage_path, '/', 1) = (select auth.uid())::text
      and split_part(image_storage_path, '/', 2) = 'suggestions'
      and exists (
        select 1
        from storage.objects object
        where object.bucket_id = 'place-images'
          and object.name = image_storage_path
          and object.owner_id = (select auth.uid())::text
      )
    )
  )
);

drop policy place_images_storage_delete_own on storage.objects;

create policy place_images_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'place-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and owner_id = (select auth.uid())::text
  and not exists (
    select 1
    from public.place_suggestions suggestion
    where suggestion.image_storage_path = storage.objects.name
      and suggestion.status = 'pending'
  )
  and not exists (
    select 1
    from public.place_images image
    where image.storage_path = name
      and image.status = 'published'
  )
);

comment on column public.place_suggestions.image_storage_path is
  'Private place-images object supplied with the suggestion; promoted to a cover on approval.';
