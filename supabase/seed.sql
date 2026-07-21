-- Stable, non-sensitive catalog data. Safe to apply locally and in cloud.

insert into public.categories (slug, icon, color, sort_order, is_active)
values
  ('playas', 'umbrella-beach', '#1F9AA5', 10, true),
  ('restaurantes', 'utensils', '#F5A623', 20, true),
  ('hoteles', 'hotel', '#2D6A8A', 30, true),
  ('museos', 'landmark', '#725A9A', 40, true),
  ('vida-nocturna', 'martini-glass', '#D65A7A', 50, true),
  ('parques', 'tree', '#68A357', 60, true),
  ('monumentos', 'monument', '#C58B45', 70, true),
  ('centros-comerciales', 'bag-shopping', '#3D7EA6', 80, true),
  ('actividades', 'person-hiking', '#93B94C', 90, true)
on conflict (slug) do update set
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

with translations(slug, locale, name) as (
  values
    ('playas', 'es', 'Playas'),
    ('playas', 'en', 'Beaches'),
    ('restaurantes', 'es', 'Restaurantes'),
    ('restaurantes', 'en', 'Restaurants'),
    ('hoteles', 'es', 'Hoteles'),
    ('hoteles', 'en', 'Hotels'),
    ('museos', 'es', 'Museos'),
    ('museos', 'en', 'Museums'),
    ('vida-nocturna', 'es', 'Vida nocturna'),
    ('vida-nocturna', 'en', 'Nightlife'),
    ('parques', 'es', 'Parques'),
    ('parques', 'en', 'Parks'),
    ('monumentos', 'es', 'Monumentos'),
    ('monumentos', 'en', 'Monuments'),
    ('centros-comerciales', 'es', 'Centros comerciales'),
    ('centros-comerciales', 'en', 'Shopping centers'),
    ('actividades', 'es', 'Actividades'),
    ('actividades', 'en', 'Activities')
)
insert into public.category_translations (category_id, locale, name)
select c.id, t.locale, t.name
from translations t
join public.categories c on c.slug = t.slug
on conflict (category_id, locale) do update set name = excluded.name;
