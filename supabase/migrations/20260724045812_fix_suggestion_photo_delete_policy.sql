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
    where image.storage_path = storage.objects.name
      and image.status = 'published'
  )
);
