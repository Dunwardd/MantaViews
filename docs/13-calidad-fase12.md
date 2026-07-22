# Fase 12 — Idiomas, accesibilidad y calidad

## Resultado

Los textos principales para turistas están centralizados en `src/locales/es.ts` y `src/locales/en.ts`. El proveedor conserva español como idioma inicial y como fallback. El cambio de idioma actualiza navegación, autenticación, exploración, categorías, recomendaciones, mapa, favoritos, perfil, sugerencias y detalle del lugar.

Los nombres y descripciones del catálogo ya incluían el idioma dentro de sus claves de React Query, por lo que el cambio fuerza una consulta nueva para lugares y categorías sin reutilizar contenido del idioma anterior.

## Accesibilidad

- Botones compartidos anuncian nombre, estado deshabilitado y estado ocupado.
- Filtros anuncian su estado seleccionado.
- Inputs usan su etiqueta visible como nombre accesible.
- Tarjetas de lugares se anuncian como enlaces.
- Mapas, marcadores, fotografías, avatares y controles de contraseña tienen etiquetas.
- Los textos secundarios usan `#5F7072`: su contraste sobre el fondo principal subió de 4,26:1 a 5,07:1.
- Una prueba automática comprueba contraste WCAG AA para texto principal, secundario, primario y errores.
- Los formularios conservan scroll, área segura y teclado manejado; los controles tienen un objetivo táctil mínimo de 48 puntos.

## Calidad y recuperación

Se añadió un límite global de errores que presenta una explicación segura y permite reintentar sin mostrar detalles internos. El algoritmo cliente de diversidad entrega primero una recomendación por categoría y mantiene orden determinista.

La suite `npm run test:unit` contiene seis pruebas para:

- normalización y validación de correo;
- contraseña y nombre visible;
- diversidad, orden y límite de recomendaciones;
- contraste de la paleta.

También deben mantenerse en verde:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
```

## Prueba web realizada

- Escritorio: 1280 × 800, sin desbordamiento horizontal.
- Móvil: 390 × 844, sin desbordamiento horizontal ni errores de consola.
- Cambio español → inglés verificado en onboarding y pantalla Explorar.
- El catálogo cloud devolvió categorías, lugares y recomendaciones en inglés después del cambio.

## Limitaciones y pruebas manuales pendientes

El equipo de desarrollo usa Windows y no dispone de simulador iOS ni de un iPhone conectado. La exportación iOS permite detectar errores de empaquetado, pero no sustituye una prueba física.

Antes de cerrar la entrega hay que realizar y marcar en el plan:

1. En Android, aumentar el tamaño de fuente del sistema y revisar onboarding, login, Explorar, mapa y detalle.
2. Probar la app con Expo Go en dos teléfonos Android distintos.
3. Si se consigue un iPhone, repetir el recorrido principal; de lo contrario, conservar esta limitación en la memoria técnica.

Estas tareas requieren dispositivos físicos y no pueden validarse únicamente desde el escritorio.
