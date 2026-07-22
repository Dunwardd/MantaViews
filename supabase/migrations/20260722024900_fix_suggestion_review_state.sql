-- Keep the review timestamp when an administrator account is removed.
-- reviewed_by uses ON DELETE SET NULL, so the previous constraint could block auth user deletion.
alter table public.place_suggestions
  drop constraint place_suggestions_check;

alter table public.place_suggestions
  add constraint place_suggestions_review_state_check
  check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status <> 'pending' and reviewed_at is not null)
  );
