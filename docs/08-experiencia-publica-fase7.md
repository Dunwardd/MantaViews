# Fase 7 — Experiencia pública

## Resultado

La experiencia de invitado de MantaViews permite completar el onboarding, elegir idioma, descubrir lugares desde Supabase Cloud, buscar y filtrar el catálogo, cargar resultados por páginas y consultar toda la información pública de un lugar sin iniciar sesión.

## Funcionalidades implementadas

- Onboarding bilingüe con preferencia persistente en SQLite para Android/iOS y almacenamiento local para web.
- Categorías y traducciones en español e inglés consultadas desde Supabase.
- Recomendaciones públicas mediante el RPC `get_recommendations`.
- Búsqueda con debounce de 300 ms mediante el RPC `search_places`.
- Filtros combinables por categoría, distancia y valoración.
- Paginación por `limit` y `offset`, con cuatro lugares por página.
- Distancia calculada en el dispositivo mediante Haversine.
- Detalle con portada, galería, horario, teléfono, sitio web y estadísticas agregadas.
- Reseñas limitadas a contenido con estado `published` y perfiles públicos seguros.
- Acciones para mostrar ruta, llamar, abrir el sitio web y compartir.
- Estados de carga, error, vacío, fin de listado y reintento.

## Decisiones de seguridad

- El bucket `place-images` continúa privado. Las imágenes publicadas se muestran con URLs firmadas de una hora.
- La app nunca utiliza la clave `service_role`; solo la clave pública configurada mediante variables `EXPO_PUBLIC_*`.
- Los enlaces externos se restringen a HTTP y HTTPS; los teléfonos se normalizan antes de abrir el protocolo `tel:`.
- Las reseñas se consultan con RLS activa y filtro explícito `status = published`.
- La ubicación del teléfono todavía no se solicita ni almacena. En esta fase, el filtro de distancia usa el centro de Manta (`-0.9538, -80.7331`) como origen conocido.
- La preferencia local contiene únicamente idioma y estado del onboarding.

## Validación realizada

- `npm run typecheck`
- `npm run lint`
- Flujo web en viewport móvil de 390 × 844 y viewport de escritorio.
- Onboarding, persistencia tras recarga y cambio de idioma ES/EN.
- Recomendaciones para invitado y categorías traducidas.
- Carga de 8 lugares en dos páginas y detección del final del catálogo.
- Búsqueda de museos y filtro de valoración con estado vacío.
- Apertura del detalle del Museo Centro Cultural Manta.
- Estados vacíos de galería y reseñas con los datos semilla actuales.

## Alcance que pasa a la fase 8

La distancia real desde el turista, permisos de ubicación, mapa nativo, marcadores, rutas con polilínea y apertura en Waze se implementarán en la fase 8. La fase 7 no solicita ubicación y sigue siendo funcional sin conceder ese permiso.
