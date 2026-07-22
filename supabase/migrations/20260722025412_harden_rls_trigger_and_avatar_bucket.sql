-- Supabase Cloud creates this event-trigger helper, while the local stack may
-- not have it. When present, API roles never need permission to invoke it.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

-- Public buckets already serve objects through their public URLs. A broad
-- SELECT policy would additionally allow clients to enumerate every avatar.
drop policy if exists avatars_public_read on storage.objects;
