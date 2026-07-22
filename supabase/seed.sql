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

-- Initial verified catalog. Coordinates use longitude/latitude in WGS 84.
with place_data(
  id,
  category_slug,
  longitude,
  latitude,
  address,
  website_url,
  price_level,
  is_featured
) as (
  values
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      'playas',
      -80.72902::double precision,
      -0.93745::double precision,
      'Malecón Escénico, Manta, Manabí',
      null::text,
      0::smallint,
      true
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'playas',
      -80.74544::double precision,
      -0.94366::double precision,
      'Avenida Barbasquillo, Manta, Manabí',
      null::text,
      0::smallint,
      false
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'playas',
      -80.81028::double precision,
      -0.95806::double precision,
      'Ruta del Spondylus, San Mateo, Manta, Manabí',
      null::text,
      0::smallint,
      false
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      'playas',
      -80.84722::double precision,
      -0.98556::double precision,
      'Ruta del Spondylus, Santa Marianita, Manta, Manabí',
      null::text,
      0::smallint,
      true
    ),
    (
      '10000000-0000-4000-8000-000000000005'::uuid,
      'playas',
      -80.90686::double precision,
      -1.07143::double precision,
      'Ruta del Spondylus, San Lorenzo, Manta, Manabí',
      null::text,
      0::smallint,
      true
    ),
    (
      '10000000-0000-4000-8000-000000000006'::uuid,
      'museos',
      -80.73042::double precision,
      -0.94187::double precision,
      'Avenida Jaime Chávez Gutiérrez y Calle 20, Manta, Manabí',
      null::text,
      0::smallint,
      true
    ),
    (
      '10000000-0000-4000-8000-000000000007'::uuid,
      'museos',
      -80.72321::double precision,
      -0.94764::double precision,
      'Avenida 2 y Calle 9, Manta, Manabí',
      null::text,
      0::smallint,
      false
    ),
    (
      '10000000-0000-4000-8000-000000000008'::uuid,
      'centros-comerciales',
      -80.73234::double precision,
      -0.94274::double precision,
      'Avenida Malecón y Calle 23, Manta, Manabí',
      'https://malldelpacifico.com.ec/'::text,
      null::smallint,
      false
    )
)
insert into public.places (
  id,
  category_id,
  status,
  location,
  address,
  website_url,
  opening_hours,
  price_level,
  is_featured,
  published_at
)
select
  pd.id,
  c.id,
  'published'::public.content_status,
  extensions.st_setsrid(
    extensions.st_point(pd.longitude, pd.latitude),
    4326
  )::extensions.geography,
  pd.address,
  pd.website_url,
  '{}'::jsonb,
  pd.price_level,
  pd.is_featured,
  now()
from place_data pd
join public.categories c on c.slug = pd.category_slug
on conflict (id) do update set
  category_id = excluded.category_id,
  status = excluded.status,
  location = excluded.location,
  address = excluded.address,
  website_url = excluded.website_url,
  price_level = excluded.price_level,
  is_featured = excluded.is_featured,
  published_at = coalesce(public.places.published_at, excluded.published_at);

with translations(place_id, locale, name, short_description, description) as (
  values
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      'es',
      'Playa El Murciélago',
      'Playa urbana junto al Malecón Escénico, cerca de servicios turísticos y del centro de Manta.',
      'Playa El Murciélago es uno de los principales espacios costeros de la zona urbana de Manta. Su ubicación junto al Malecón Escénico permite combinar la visita al mar con restaurantes, comercios y otros puntos de interés cercanos.'
    ),
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      'en',
      'El Murciélago Beach',
      'An urban beach beside the scenic boardwalk, close to visitor services and central Manta.',
      'El Murciélago Beach is one of the main coastal spaces in urban Manta. Its location beside the scenic boardwalk makes it easy to combine time by the sea with nearby restaurants, shops, and other points of interest.'
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'es',
      'Playa Barbasquillo',
      'Tramo de costa urbana al oeste de El Murciélago, próximo a hoteles y la avenida Barbasquillo.',
      'Barbasquillo forma parte de la línea costera urbana de Manta. Es un punto apropiado para contemplar el océano y recorrer el sector occidental de la ciudad, donde se concentran hoteles, restaurantes y espacios comerciales.'
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'en',
      'Barbasquillo Beach',
      'A stretch of urban coastline west of El Murciélago, near hotels and Barbasquillo Avenue.',
      'Barbasquillo is part of Manta’s urban coastline. It is a convenient place to view the ocean and explore the western side of the city, an area with hotels, restaurants, and commercial spaces.'
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'es',
      'Playa San Mateo',
      'Playa de ambiente costero en la parroquia San Mateo, conectada con Manta por la Ruta del Spondylus.',
      'Playa San Mateo se encuentra al oeste del área urbana de Manta y conserva la relación del sector con el mar y la actividad pesquera. La Ruta del Spondylus permite llegar desde la ciudad y continuar hacia otras playas del cantón.'
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'en',
      'San Mateo Beach',
      'A coastal beach in San Mateo parish, connected to Manta by the Spondylus Route.',
      'San Mateo Beach lies west of urban Manta and reflects the area’s close relationship with the sea and fishing activity. The Spondylus Route connects it with the city and continues toward other beaches in the canton.'
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      'es',
      'Playa Santa Marianita',
      'Amplia playa de la parroquia Santa Marianita, conocida por su paisaje y actividades acuáticas.',
      'Santa Marianita es una playa del cantón Manta ubicada sobre la Ruta del Spondylus. Su extensión, el viento y el entorno costero atraen a visitantes interesados en descansar, disfrutar de la gastronomía local y practicar actividades acuáticas.'
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      'en',
      'Santa Marianita Beach',
      'A broad beach in Santa Marianita parish, known for its scenery and water activities.',
      'Santa Marianita is a beach in Manta canton along the Spondylus Route. Its open shoreline, wind, and coastal setting attract visitors who want to relax, enjoy local food, or take part in water activities.'
    ),
    (
      '10000000-0000-4000-8000-000000000005'::uuid,
      'es',
      'Playa San Lorenzo',
      'Playa de entorno rural en el extremo sur del cantón, cercana a senderos y paisajes de Pacoche.',
      'Playa San Lorenzo se ubica en una parroquia rural del cantón Manta, sobre la Ruta del Spondylus. Ofrece un paisaje costero menos urbano y sirve como punto de partida para conocer el sector de San Lorenzo y los atractivos naturales cercanos.'
    ),
    (
      '10000000-0000-4000-8000-000000000005'::uuid,
      'en',
      'San Lorenzo Beach',
      'A beach in the rural south of the canton, near Pacoche trails and coastal landscapes.',
      'San Lorenzo Beach is located in a rural parish of Manta canton along the Spondylus Route. It offers a less urban coastal landscape and is a useful starting point for exploring San Lorenzo and nearby natural attractions.'
    ),
    (
      '10000000-0000-4000-8000-000000000006'::uuid,
      'es',
      'Museo Centro Cultural Manta',
      'Espacio cultural urbano con exposiciones vinculadas al patrimonio arqueológico y artístico de la región.',
      'El Museo Centro Cultural Manta forma parte de los atractivos culturales reconocidos por el cantón. Su visita permite acercarse al patrimonio arqueológico, histórico y artístico de Manabí desde un espacio ubicado cerca del Malecón Escénico.'
    ),
    (
      '10000000-0000-4000-8000-000000000006'::uuid,
      'en',
      'Manta Cultural Center Museum',
      'An urban cultural venue with exhibitions related to the region’s archaeological and artistic heritage.',
      'The Manta Cultural Center Museum is one of the canton’s recognized cultural attractions. A visit offers an introduction to the archaeological, historical, and artistic heritage of Manabí in a venue near the scenic boardwalk.'
    ),
    (
      '10000000-0000-4000-8000-000000000007'::uuid,
      'es',
      'Museo Municipal Etnográfico Cancebí',
      'Museo dedicado a la memoria etnográfica y a las formas de vida de la campiña y la costa manabita.',
      'El Museo Cancebí presenta objetos y escenas relacionados con la vida cotidiana de las comunidades de la campiña y la costa de Manabí. Es una parada cultural para comprender oficios, tradiciones y expresiones de la identidad local.'
    ),
    (
      '10000000-0000-4000-8000-000000000007'::uuid,
      'en',
      'Cancebí Municipal Ethnographic Museum',
      'A museum focused on ethnographic memory and ways of life from rural and coastal Manabí.',
      'The Cancebí Museum presents objects and scenes connected with everyday life in rural and coastal communities of Manabí. It is a cultural stop for learning about local trades, traditions, and expressions of identity.'
    ),
    (
      '10000000-0000-4000-8000-000000000008'::uuid,
      'es',
      'Mall del Pacífico',
      'Centro comercial próximo al Malecón Escénico con tiendas, restaurantes, entretenimiento y servicios.',
      'Mall del Pacífico es un centro comercial situado cerca de Playa El Murciélago y del Malecón Escénico. Reúne opciones de compras, gastronomía, entretenimiento y servicios en una ubicación accesible desde el centro turístico de Manta.'
    ),
    (
      '10000000-0000-4000-8000-000000000008'::uuid,
      'en',
      'Mall del Pacífico',
      'A shopping center near the scenic boardwalk with stores, dining, entertainment, and services.',
      'Mall del Pacífico is a shopping center near El Murciélago Beach and the scenic boardwalk. It brings together shopping, dining, entertainment, and services in a location accessible from Manta’s main visitor area.'
    )
)
insert into public.place_translations (
  place_id,
  locale,
  name,
  short_description,
  description
)
select place_id, locale, name, short_description, description
from translations
on conflict (place_id, locale) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description;
