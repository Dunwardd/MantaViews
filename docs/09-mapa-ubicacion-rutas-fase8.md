# Fase 8 — Mapa, ubicación y rutas

## Resultado

La aplicación muestra los lugares turísticos de Manta sobre un mapa, permite filtrarlos por categoría, seleccionar un destino, consultar lugares cercanos y solicitar una vista previa de ruta. Sin permiso de ubicación la pantalla continúa siendo funcional y usa el centro de Manta únicamente como origen de la vista previa.

## Implementación

- Android e iOS usan `react-native-maps`, con marcadores, ubicación del usuario y polilínea.
- Web usa Leaflet con mosaicos reales de OpenStreetMap, zoom, marcadores por categoría, ubicación del usuario y polilínea de ruta.
- `expo-location` solicita permiso en primer plano únicamente cuando el usuario pulsa **Usar mi ubicación**.
- Los lugares cercanos se obtienen mediante la función PostGIS `nearby_places` con un radio de 15 km.
- Las rutas se solicitan a la Edge Function `route-preview`, que usa Valhalla sobre datos de OpenStreetMap sin clave API.
- Google Maps y Waze se abren mediante enlaces HTTPS con las coordenadas del destino.
- La coordenada del usuario vive solo en el estado de la pantalla. No existe operación de inserción o actualización que la persista en Supabase ni en almacenamiento local.

## Configuración móvil

`app.json` declara el permiso de ubicación con este propósito: mostrar lugares cercanos y calcular rutas sin almacenar la posición. Para Expo Go no se necesita una clave nativa de Google Maps; una compilación destinada a tiendas debe revisar la configuración del proveedor de mapas antes de publicarse.

## Configuración web

La implementación web carga los mosaicos estándar de OpenStreetMap directamente desde el navegador y mantiene visible su atribución. No descarga mapas en lote ni implementa precarga u operación sin conexión. Esta configuración es apropiada para la demostración académica y tráfico bajo; un despliegue público con mayor uso deberá contratar o desplegar un proveedor de mosaicos con capacidad garantizada.

## Proveedor de rutas

La Edge Function usa el servidor público de demostración de Valhalla mantenido por FOSSGIS e.V. La petición incluye `X-Client-Id: MantaViews-academic`, respeta el uso razonable y no necesita secretos. Los perfiles públicos de la app se traducen a `pedestrian`, `auto` y `bicycle`. La respuesta polyline6 se decodifica en el servidor y se entrega a la app como GeoJSON `LineString`.

Este servidor es adecuado para el proyecto académico y pruebas con tráfico bajo. Para publicar una aplicación con usuarios reales se debe notificar el uso al proyecto Valhalla o desplegar una instancia propia.

## Pruebas realizadas

- Carga de ocho lugares publicados y nueve categorías.
- Filtrado de marcadores a la categoría Museos.
- Selección de marcador y visualización de la ficha resumida.
- Funcionamiento sin permiso de ubicación.
- Solicitud directa real a Valhalla con coordenadas de Manta.
- Solicitud cloud a `route-preview`: HTTP 200, 1.424 metros, 1.009 segundos y 37 puntos GeoJSON.
- Flujo web completo: selección de Playa El Murciélago y ruta peatonal visible de 2,2 km y 26 minutos.
- Mapa cartográfico web de OpenStreetMap verificado con calles, costa, zoom, marcadores y atribución visibles.
- Diseño web verificado en viewport móvil de 390 × 844 px.
- Validación estática, lint, formato y exportación multiplataforma.

## Aceptación

La versión 4 de `route-preview` fue desplegada y verificada en Supabase con estado HTTP 200. El flujo completo también fue probado desde la pantalla Mapa. El contrato devuelve la polilínea, la distancia y la duración esperadas, por lo que la fase queda aceptada.
