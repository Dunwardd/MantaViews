-- Cover the referencing side of foreign keys used by joins, cascades and RLS.
create index if not exists admin_audit_logs_admin_id_idx
  on public.admin_audit_logs (admin_id);

create index if not exists place_images_review_id_place_id_idx
  on public.place_images (review_id, place_id);

create index if not exists place_images_uploader_id_idx
  on public.place_images (uploader_id);

create index if not exists place_suggestions_category_id_idx
  on public.place_suggestions (category_id);

create index if not exists place_suggestions_reviewed_by_idx
  on public.place_suggestions (reviewed_by);

create index if not exists place_suggestions_submitted_by_idx
  on public.place_suggestions (submitted_by);

create index if not exists places_category_id_idx
  on public.places (category_id);

create index if not exists places_created_by_idx
  on public.places (created_by);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

create index if not exists reports_reviewed_by_idx
  on public.reports (reviewed_by);

create index if not exists reviews_user_id_idx
  on public.reviews (user_id);

create index if not exists user_roles_assigned_by_idx
  on public.user_roles (assigned_by);
