# Fuentes y atribuciones del catálogo

Fecha de revisión: 23 de julio de 2026.

## Catálogo turístico

El catálogo de demostración contiene 43 lugares publicados y clasificados en las nueve categorías de MantaViews. Los nombres turísticos se contrastaron con el portal [Visit Manta](https://www.visitmanta.org/en/properties-2) y la página de [Turismo de la Alcaldía de Manta](https://manta.gob.ec/turismo/). Las coordenadas y tipos de lugar se verificaron individualmente contra los objetos enlazados de OpenStreetMap.

Cada fila conserva `source_name`, `source_url` y `source_checked_at`. Los enlaces exactos se encuentran en `supabase/seed_phase13.sql`, lo que permite auditar o volver a comprobar cada ubicación. Las descripciones en español y sus traducciones al inglés fueron redactadas específicamente para MantaViews; no son copias de las fuentes.

Los datos cartográficos de OpenStreetMap se usan bajo ODbL y requieren la atribución “© OpenStreetMap contributors”, que ya muestra el mapa de la aplicación.

## Cobertura de imágenes

Los 43 lugares publicados tienen exactamente una portada publicada y su objeto correspondiente en el bucket privado `place-images`. La aplicación entrega estas imágenes mediante URL firmada. Todas las filas tienen ruta de almacenamiento, texto alternativo, fuente, atribución y licencia.

Las imágenes incorporadas se validaron como JPEG o WebP y con un tamaño máximo de 5 MB. El manifiesto reproducible de las 22 portadas añadidas en esta revisión está en `scripts/ingest-place-covers.mjs`.

## Portadas con licencia abierta o fuente institucional

| Lugar | Autor o fuente | Licencia | Página de origen |
|---|---|---|---|
| Playa El Murciélago | Cayambe / Wikimedia Commons | CC BY-SA 3.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Ecuador_Manta_Murci%C3%A9lago_beach_01.jpg) |
| Playa Barbasquillo | Siguifredoagapito / Wikimedia Commons | CC BY-SA 3.0 | [Archivo](https://commons.wikimedia.org/wiki/File:BarbasquilloManta.jpg) |
| Playa Santa Marianita | Andrés Medina / Wikimedia Commons | CC0 1.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Santa_Marianita_beach_(Unsplash).jpg) |
| Museo Municipal Etnográfico Cancebí | Jriscom14 / Wikimedia Commons | CC0 1.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Coat_of_arms_of_Ecuador_Exhibited_in_the_CANCEBI_Museum_Manta_-Ecuador_Jan_2025.jpg) |
| Playa San Mateo, Playa San Lorenzo, Museo Centro Cultural Manta, Mall del Pacífico, Playa Piedra Larga, Parque Central, Megaparque Centenario Agustín Intriago, Plaza del Mar, Memorial 16A, Silla Ceremonial de Manta, Monumento Eloy Alfaro, Paseo Shopping Manta, La Quadra, Corrales Marinos de Ligüiqui, Centro Cultural Buque Azart y Terminal de Cruceros de Manta | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Hotel Balandra | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Hoteles de Visit Manta](https://www.visitmanta.org/en/properties-1) |

## Portadas añadidas en esta revisión

| Lugar | Autor o fuente | Tipo | Página de origen |
|---|---|---|---|
| Cevichería Flipper #3 | Minube | Fotografía del lugar | [MegaFlipper](https://www.minube.com/rincon/-mega-flipper-_-flavio-reyes-a3721038) |
| Cevichería Umiña | NEXDU | Fotografía del lugar | [Cevichería Umiña](https://www.nexdu.com/ec/manta-m/empresa/cevicheria-umina-47314) |
| Finisterre | Rich Edwards Imagery | Fotografía del lugar | [Restaurante Finisterre](https://richedwardsimagery.wordpress.com/2022/04/04/eat-local-restaurante-finisterre-manta-ecuador/) |
| Hotel Oro Verde Manta | Hotel Oro Verde | Sitio oficial | [Oro Verde Manta](https://www.oroverdemanta.com/) |
| Hotel Poseidón | ViajandoX | Fotografía del lugar | [Hotel Poseidón](https://ec.viajandox.com/manta/hotel-poseidon-H172) |
| Mantahost Hotel | Mantahost Hotel | Sitio oficial | [Mantahost](https://mantahosthotel.com/) |
| Martinica Manta | Martinica Restaurant | Sitio oficial | [Martinica](https://www.martinica.com.ec/index2.htm) |
| Monumento al Pescador | Visit Manta | Fuente institucional | [Escultura del Cholo Mantense](https://www.visitmanta.org/en/properties-2/escultura-del-cholo-mantense) |
| Museo del Banco Central | Entorno Turístico | Fotografía del lugar | [Museos en Manta](https://www.entornoturistico.com/los-museos-en-manta-ecuador/) |
| Playa Ligüiqui | Flickr | Fotografía del lugar | [Playa Ligüiqui](https://www.flickr.com/photos/127385686@N02/15408791528) |
| Playa Los Esteros y Playa Tarqui | Manta 360 | Fotografía del lugar | [Los Esteros](https://manta360.com/la-ciudad-de-manta-ecuador/los-esteros/) |
| Plazoleta Azúa | La Gente de Manabí | Fotografía del lugar | [Plazoleta Azúa](https://lagentedemanabi.jimdofree.com/2014/12/11/plazoleta-az%C3%BAa-de-manta-ya-tiene-un-monumento-de-su-patrono/) |
| Sensation Lounge Bar | Raves Ecuador | Evento realizado en el lugar | [Evento en Club Sensation](https://ravesecuador.com/events/cali-en-manta-underground/) |
| Umiña Tennis | El Universo | Evento realizado en el lugar | [Torneo en Umiña Tennis](https://www.eluniverso.com/deportes/otros-deportes/vii-ecuajunior-se-jugo-en-manta-con-mas-de-un-centenar-de-ninos-nota/) |
| Wyndham Manta | Wyndham Hotels & Resorts | Galería oficial | [Wyndham Manta](https://www.wyndhamhotels.com/wyndham/manta-ecuador/wyndham-manta-sail-plaza-hotel-and-convention-center/photo-gallery) |
| Adrenalina Discotec, Bacana Bar, Planeta Rosa Karaoke y Plaza del Sol | Rent In Manta | Vista contextual de la Zona Rosa | [Vida nocturna en Manta](https://rentinmanta.com/rim-blog/2023/7/6/10-things-to-do-in-manta) |
| Museo del Mar | Manta 360 | Vista contextual de Los Esteros y Playita Mía | [Los Esteros](https://manta360.com/la-ciudad-de-manta-ecuador/los-esteros/) |
| Tortuga de San Lorenzo | Patricio Ramos / El Telégrafo | Vista contextual de conservación en San Lorenzo | [Santuario de tortugas](https://www.eltelegrafo.com.ec/noticias/septimo/1/san-lorenzo-el-santuario-de-las-tortugas-marinas-en-manabi) |

Las siete portadas de contexto —incluido el afiche de Sensation— están identificadas en su atribución y texto alternativo; no se presentan como fotografías de la fachada. Conviene reemplazarlas por fotos propias del equipo cuando estén disponibles.

## Consideraciones de uso

Las fuentes que no declaran una licencia abierta se registran como `Copyright — uso académico`. Son apropiadas para la demostración académica actual, pero antes de publicar comercialmente o distribuir la aplicación en tiendas deben reemplazarse por fotografías propias, material con licencia abierta o imágenes con autorización expresa.
