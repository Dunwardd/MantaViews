# MantaViews — Sistema visual y navegación de la fase 6

## Identidad

La interfaz usa una paleta inspirada en el mar, el sol y la vegetación costera de Manta:

| Token      | Valor     | Uso principal                      |
| ---------- | --------- | ---------------------------------- |
| `primary`  | `#07696C` | Acciones principales y selección   |
| `deepTeal` | `#034F55` | Texto de marca y contraste         |
| `ocean`    | `#2FA7B0` | Información y elementos turísticos |
| `sand`     | `#FAF6EB` | Fondos cálidos                     |
| `sun`      | `#F5A719` | Destacados                         |
| `lime`     | `#A8B83F` | Acentos secundarios                |

Los colores semánticos, tipografía del sistema, espaciado, radios, sombras y límites responsive se encuentran en `src/theme`.

El icono `assets/images/mantaviews-app-icon.png` es una variante simplificada del logo entregado: conserva el globo, la palma, la maleta y el avión, y adapta sus colores a la identidad MantaViews. Se usa como icono de aplicación, adaptive icon, splash, favicon y marca dentro de las pantallas.

## Componentes base

`src/components/ui` contiene:

- `AppButton`: variantes principal, secundaria, transparente y destructiva.
- `AppInput`: label, error accesible y accesorio derecho.
- `SurfaceCard`: superficie consistente con borde, radio y sombra.
- `FilterChip`: selección accesible con contraste calculado dinámicamente.
- `RatingDisplay`: valoración con formato tabular.
- `AppAvatar`: imagen o iniciales como fallback.
- `LoadingState` y `FeedbackState`: carga, vacío y error con acción opcional.
- `AppIcon`: SF Symbols en iOS y fallback compatible en Android/web.

Los antiguos componentes de autenticación y estado ahora reutilizan esta base para conservar compatibilidad con las pantallas existentes.

## Navegación

- Tabs: Explorar, Mapa, Favoritos y Perfil.
- Stacks: raíz, autenticación y detalle de lugar.
- Modal: Preferencias.
- Proveedor de idioma: español e inglés con actualización inmediata de títulos y tabs.
- Los `ScrollView` usan ajuste automático de insets.
- El contenido principal tiene un ancho máximo de 960 px y los formularios de 480 px.
- Los controles interactivos respetan un mínimo de 48 px.

## Verificación

- Revisión visual web en `390 × 844` y `1440 × 900`.
- Navegación por tabs validada mediante roles accesibles.
- Cambio español/inglés verificado desde el modal.
- Contraste dinámico verificado con una categoría amarilla seleccionada.
- TypeScript, ESLint y Prettier sin errores.
- Bundles de Android, iOS y web exportados correctamente con Expo SDK 54.
