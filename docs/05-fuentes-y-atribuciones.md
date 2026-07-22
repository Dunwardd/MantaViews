# Fuentes y atribuciones del catálogo

Fecha de revisión: 22 de julio de 2026.

## Catálogo turístico

El catálogo de demostración contiene 43 lugares publicados y clasificados en las nueve categorías de MantaViews. Los nombres turísticos se contrastaron con el portal [Visit Manta](https://www.visitmanta.org/en/properties-2) y la página de [Turismo de la Alcaldía de Manta](https://manta.gob.ec/turismo/). Las coordenadas y tipos de lugar se verificaron individualmente contra los objetos enlazados de OpenStreetMap.

Cada fila conserva `source_name`, `source_url` y `source_checked_at`. Los enlaces exactos se encuentran en `supabase/seed_phase13.sql`, lo que permite auditar o volver a comprobar cada ubicación. Las descripciones en español y sus traducciones al inglés fueron redactadas específicamente para MantaViews; no son copias de las fuentes.

Los datos cartográficos de OpenStreetMap se usan bajo ODbL y requieren la atribución “© OpenStreetMap contributors”, que ya muestra el mapa de la aplicación.

## Imágenes de portada

Hay 21 lugares con portada. Las imágenes se cargaron en el bucket privado `place-images` como variantes JPEG optimizadas de entre 48 KB y 312 KB. La aplicación las entrega mediante URL firmada.

| Lugar | Autor o fuente | Licencia | Página de origen |
|---|---|---|---|
| Playa El Murciélago | Cayambe / Wikimedia Commons | CC BY-SA 3.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Ecuador_Manta_Murci%C3%A9lago_beach_01.jpg) |
| Playa Barbasquillo | Siguifredoagapito / Wikimedia Commons | CC BY-SA 3.0 | [Archivo](https://commons.wikimedia.org/wiki/File:BarbasquilloManta.jpg) |
| Playa San Mateo | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Playa Santa Marianita | Andrés Medina (andydjpsyco) / Wikimedia Commons | CC0 1.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Santa_Marianita_beach_(Unsplash).jpg) |
| Playa San Lorenzo | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Museo Centro Cultural Manta | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Museo Municipal Etnográfico Cancebí | Jriscom14 / Wikimedia Commons | CC0 1.0 | [Archivo](https://commons.wikimedia.org/wiki/File:Coat_of_arms_of_Ecuador_Exhibited_in_the_CANCEBI_Museum_Manta_-Ecuador_Jan_2025.jpg) |
| Mall del Pacífico | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Playa Piedra Larga | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Parque Central | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Megaparque Centenario Agustín Intriago | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Plaza del Mar | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Memorial 16A | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Silla Ceremonial de Manta | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Monumento Eloy Alfaro | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Paseo Shopping Manta | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| La Quadra | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Hotel Balandra | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Hoteles de Visit Manta](https://www.visitmanta.org/en/properties-1) |
| Corrales Marinos de Ligüiqui | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Centro Cultural Buque Azart | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |
| Terminal de Cruceros de Manta | Visit Manta — Buró Turístico de Manta | Copyright; demo académica | [Visit Manta](https://www.visitmanta.org/en/properties-2) |

Las filas de `place_images` guardan la URL de origen, el texto de atribución, el nombre de la licencia y su enlace cuando existe. Las 17 imágenes de Visit Manta no declaran licencia abierta; deben reemplazarse por material autorizado antes de una publicación comercial o en tiendas.
