create table public.admin_dashboard_events (
  id smallint primary key default 1 check (id = 1),
  updated_at timestamptz not null default now()
);

insert into public.admin_dashboard_events (id)
values (1);

alter table public.admin_dashboard_events enable row level security;

revoke all on public.admin_dashboard_events from public, anon, authenticated;
grant select on public.admin_dashboard_events to authenticated;
grant all privileges on public.admin_dashboard_events to service_role;

create policy admin_dashboard_events_admin_select
on public.admin_dashboard_events for select to authenticated
using ((select private.is_admin()));

create or replace function private.touch_admin_dashboard_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admin_dashboard_events
  set updated_at = clock_timestamp()
  where id = 1;
  return null;
end;
$$;

revoke all on function private.touch_admin_dashboard_event() from public;

create trigger favorites_touch_admin_dashboard
after insert or delete on public.favorites
for each statement execute function private.touch_admin_dashboard_event();

create trigger tourist_votes_touch_admin_dashboard
after insert or update or delete on public.tourist_votes
for each statement execute function private.touch_admin_dashboard_event();

alter publication supabase_realtime
  add table public.admin_dashboard_events;

comment on table public.admin_dashboard_events is
  'Single-row, admin-only Realtime signal. Contains no user activity details.';

comment on function private.touch_admin_dashboard_event() is
  'Trigger-only dashboard invalidation signal; execution is revoked from API roles.';
