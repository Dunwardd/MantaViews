# MantaViews — Plan de implementación

## 1. Uso de este documento

- `[ ]` Pendiente
- `[-]` En progreso
- `[x]` Completada y verificada

Una tarea solo se marca como completada cuando cumple su criterio de aceptación. Este archivo será el registro principal del avance y se actualizará durante la implementación.

## 2. Estado general

- [x] Definir objetivo y alcance del MVP.
- [x] Seleccionar arquitectura Expo + Supabase.
- [x] Diseñar esquema de base de datos.
- [x] Definir endpoints y estrategia de pruebas Postman.
- [x] Definir flujo de la aplicación.
- [x] Crear plan de implementación ordenado.
- [ ] Implementar y verificar el MVP completo.

## 3. Fase 0 — Preparación y coordinación

- [ ] Confirmar que el docente acepta Supabase como backend cloud.
- [ ] Confirmar si Google OAuth debe estar operativo en la presentación.
- [ ] Crear cuentas del equipo en Expo, Supabase y proveedor de rutas.
- [ ] Definir responsables principales y revisores por área.
- [ ] Acordar estrategia Git: rama principal protegida y ramas cortas por funcionalidad.
- [ ] Definir datos mínimos: 30–50 lugares verificados.
- [ ] Confirmar si el logo actual será rediseñado o solo recoloreado.
- [ ] Crear tablero simple de tareas y registrar bloqueos.

Criterio de aceptación: las tres personas pueden acceder a los servicios y conocen su responsabilidad inmediata.

## 4. Fase 1 — Inicialización del proyecto

- [ ] Crear proyecto Expo con TypeScript y Expo Router.
- [ ] Mantener rutas únicamente en `src/app`.
- [ ] Crear carpetas `components`, `screens`, `features`, `services`, `hooks`, `utils`, `theme`, `i18n` y `types`.
- [ ] Configurar alias `@/*` hacia `src/*`.
- [ ] Configurar ESLint, Prettier y scripts de verificación.
- [ ] Añadir `.env.example` sin secretos.
- [ ] Añadir `.env*`, credenciales y archivos locales sensibles a `.gitignore`.
- [ ] Instalar dependencias compatibles usando `npx expo install` cuando corresponda.
- [ ] Configurar TanStack Query con caché y reintentos controlados.
- [ ] Configurar Supabase client y persistencia segura de sesión.
- [ ] Confirmar que el proyecto abre en Expo Go Android e iOS disponibles.
- [ ] Confirmar que Expo Web compila.

Criterio de aceptación: app vacía ejecutándose en móvil y web, lint/typecheck exitosos y ningún secreto versionado.

## 5. Fase 2 — Base de datos Supabase

- [ ] Crear proyecto Supabase en la región apropiada.
- [ ] Habilitar `postgis`, `pgcrypto` y `pg_trgm`.
- [ ] Crear migración de enums.
- [ ] Crear tablas de usuarios: `profiles`, `user_roles`, `user_interests`.
- [ ] Crear tablas de catálogo: `categories`, `category_translations`.
- [ ] Crear tablas de lugares: `places`, `place_translations`, `place_images`.
- [ ] Crear tablas sociales: `reviews`, `favorites`, `tourist_votes`.
- [ ] Crear tablas de comunidad: `place_suggestions`, `reports`.
- [ ] Crear `admin_audit_logs`.
- [ ] Añadir claves foráneas, checks y restricciones unique.
- [ ] Crear índices B-tree, GiST y trigram.
- [ ] Crear trigger reutilizable de `updated_at`.
- [ ] Crear trigger de perfil/rol al registrarse un usuario.
- [ ] Crear vista `place_stats` con `security_invoker`.
- [ ] Crear función protegida `is_admin`.
- [ ] Crear RPC `search_places`.
- [ ] Crear RPC `nearby_places`.
- [ ] Crear RPC `get_place_detail`.
- [ ] Crear RPC `get_recommendations`.
- [ ] Sembrar categorías en español e inglés.
- [ ] Crear usuario administrador inicial de forma segura.
- [ ] Ejecutar migraciones desde una base limpia para validar reproducibilidad.

Criterio de aceptación: esquema recreable, restricciones comprobadas y consultas geográficas devolviendo distancias correctas.

## 6. Fase 3 — Seguridad, RLS y Storage

- [ ] Activar RLS explícitamente en todas las tablas públicas.
- [ ] Crear políticas de lectura pública para contenido publicado.
- [ ] Crear políticas de lectura/escritura del perfil propio.
- [ ] Crear políticas de reseñas propias.
- [ ] Crear políticas de favoritos propios.
- [ ] Crear políticas de votos propios.
- [ ] Crear políticas de intereses propios.
- [ ] Crear políticas de sugerencias y reportes propios.
- [ ] Bloquear escrituras del cliente en `user_roles` y auditoría.
- [ ] Crear políticas administrativas usando `is_admin`.
- [ ] Crear buckets `avatars` y `place-images`.
- [ ] Limitar rutas de Storage por `user_id`.
- [ ] Limitar MIME y tamaño máximo de imágenes.
- [ ] Verificar que `service_role` no esté en `.env` público ni en el repositorio.
- [ ] Probar acceso invitado, usuario A, usuario B y administrador.

Criterio de aceptación: un usuario no puede leer ni modificar recursos privados de otro, y ningún cliente puede asignarse privilegios.

## 7. Fase 4 — Autenticación

- [ ] Configurar registro por correo y contraseña.
- [ ] Configurar confirmación de correo según necesidades de la demo.
- [ ] Implementar login y cierre de sesión.
- [ ] Implementar recuperación y cambio de contraseña.
- [ ] Restaurar/refrescar sesión al abrir la app.
- [ ] Crear provider/hook de sesión.
- [ ] Implementar rutas protegidas y guard de acciones contextuales.
- [ ] Configurar Google OAuth en Supabase.
- [ ] Configurar esquema y redirect URI para development build/web.
- [ ] Probar Google OAuth fuera de Expo Go.
- [ ] Limpiar caché privada al cerrar sesión.

Criterio de aceptación: email/password completo y sesión persistente; Google probado en una plataforma de presentación si forma parte del MVP.

## 8. Fase 5 — Backend y endpoints

- [ ] Definir validaciones Zod compartidas para bodies y parámetros.
- [ ] Verificar endpoints Auth en Postman.
- [ ] Verificar Data API pública para categorías y lugares.
- [ ] Verificar RPC de búsqueda, detalle y cercanía.
- [ ] Verificar CRUD de perfil e intereses.
- [ ] Verificar CRUD de reseñas, favoritos y votos.
- [ ] Verificar sugerencias, imágenes y reportes.
- [ ] Implementar Edge Function `route-preview`.
- [ ] Guardar la clave del proveedor de rutas como secreto server-side.
- [ ] Normalizar errores del proveedor externo.
- [ ] Implementar timeout y límites de solicitudes para rutas.
- [ ] Implementar Edge Function `admin-places`.
- [ ] Implementar Edge Function `admin-suggestions`/`review-suggestion`.
- [ ] Implementar Edge Function `moderate-content`.
- [ ] Implementar Edge Function `admin-reports`/`resolve-report`.
- [ ] Registrar acciones administrativas en auditoría.
- [ ] Crear y exportar colección Postman sin secretos.
- [ ] Crear entorno Postman de ejemplo.
- [ ] Añadir tests automáticos básicos en Postman.

Criterio de aceptación: la colección Postman cubre casos exitosos, validación, autenticación y autorización.

## 9. Fase 6 — Base visual y navegación frontend

- [ ] Crear tokens de color según la identidad MantaViews.
- [ ] Definir tipografía, espaciado, radios y sombras.
- [ ] Preparar logo e icono definitivos.
- [ ] Implementar componentes base: botón, input, tarjeta, chip, rating, avatar y estados.
- [ ] Implementar componentes de carga, vacío y error.
- [ ] Crear root layout con proveedores de sesión, Query y traducción.
- [ ] Crear tabs: Explorar, Mapa, Favoritos y Perfil.
- [ ] Crear stacks y rutas modales.
- [ ] Verificar safe areas y tamaños de pantalla.
- [ ] Verificar contraste, labels accesibles y tamaño táctil.

Criterio de aceptación: navegación completa con pantallas placeholder y diseño consistente en Android, iOS y web.

## 10. Fase 7 — Experiencia pública

- [ ] Implementar onboarding e idioma inicial.
- [ ] Implementar pantalla Explorar.
- [ ] Mostrar categorías.
- [ ] Mostrar lugares destacados.
- [ ] Integrar recomendaciones para invitado.
- [ ] Implementar búsqueda con debounce.
- [ ] Implementar filtros por categoría, distancia y valoración.
- [ ] Implementar listado paginado.
- [ ] Implementar detalle del lugar.
- [ ] Mostrar portada, galería, horario y contacto.
- [ ] Mostrar estadísticas y reseñas.
- [ ] Añadir compartir y enlaces externos seguros.
- [ ] Verificar estados de carga, vacío, error y reintento.

Criterio de aceptación: un invitado puede descubrir un lugar desde inicio o búsqueda y consultar toda su información publicada.

## 11. Fase 8 — Mapa, ubicación y rutas

- [ ] Instalar y configurar `react-native-maps`.
- [ ] Crear implementación web equivalente o placeholder controlado.
- [ ] Mostrar región inicial de Manta.
- [ ] Renderizar marcadores por categoría.
- [ ] Mostrar tarjeta al seleccionar un marcador.
- [ ] Solicitar ubicación solo al usar funciones cercanas.
- [ ] Gestionar permiso concedido, rechazado y bloqueado.
- [ ] Consultar lugares cercanos con PostGIS.
- [ ] Llamar `route-preview`.
- [ ] Dibujar polilínea, distancia y duración.
- [ ] Añadir botón para abrir Google Maps/Waze.
- [ ] Confirmar mediante logs y revisión que la ubicación no se persiste.

Criterio de aceptación: el usuario ve lugares y una ruta; la app sigue funcionando sin conceder ubicación.

## 12. Fase 9 — Funciones de usuario

- [ ] Implementar perfil y edición de idioma/nombre/avatar.
- [ ] Implementar selección de intereses.
- [ ] Implementar agregar/quitar favoritos.
- [ ] Implementar listado de favoritos.
- [ ] Implementar crear/editar/archivar reseña.
- [ ] Impedir doble envío de formularios.
- [ ] Implementar voto turístico mediante upsert.
- [ ] Implementar sugerencia de nuevo lugar.
- [ ] Mostrar estado de sugerencias propias.
- [ ] Implementar reportes.
- [ ] Implementar selección, compresión y subida de imágenes.
- [ ] Mostrar estado pendiente de moderación.
- [ ] Reanudar acción después del login contextual.

Criterio de aceptación: todas las escrituras requieren sesión, actualizan caché correctamente y respetan propiedad/RLS.

## 13. Fase 10 — Recomendaciones

- [ ] Definir pesos finales del algoritmo y documentarlos.
- [ ] Implementar fallback popular/diverso para invitados.
- [ ] Integrar intereses del usuario.
- [ ] Integrar valoración y popularidad.
- [ ] Integrar distancia solo cuando se otorgue permiso.
- [ ] Excluir lugares archivados o rechazados.
- [ ] Evitar resultados repetitivos de una sola categoría.
- [ ] Explicar brevemente “Por qué se recomienda”.
- [ ] Probar usuario nuevo, usuario sin intereses y usuario activo.

Criterio de aceptación: la misma entrada produce resultados explicables y nunca requiere un servicio de IA pagado.

## 14. Fase 11 — Panel administrativo web

- [ ] Crear layout web protegido para admin.
- [ ] Implementar resumen de pendientes.
- [ ] Implementar listado, búsqueda y filtros de lugares.
- [ ] Implementar formulario bilingüe de lugar.
- [ ] Implementar selección de coordenadas en mapa.
- [ ] Implementar publicar y archivar.
- [ ] Implementar revisión de sugerencias.
- [ ] Implementar moderación de reseñas e imágenes.
- [ ] Implementar gestión de reportes.
- [ ] Mostrar confirmación antes de acciones destructivas lógicas.
- [ ] Verificar que cada acción genere auditoría.
- [ ] Verificar acceso denegado con cuenta normal.

Criterio de aceptación: un administrador gestiona el catálogo sin usar el Dashboard de Supabase y un usuario normal no puede acceder ni ejecutar acciones.

## 15. Fase 12 — Idiomas, accesibilidad y calidad

- [ ] Centralizar todos los textos en archivos `es` y `en`.
- [ ] Implementar fallback a español.
- [ ] Revisar que cambiar idioma refresque lugares y categorías.
- [ ] Añadir labels accesibles a botones, iconos, inputs y mapa.
- [ ] Probar tamaño de fuente aumentado.
- [ ] Verificar contraste de la paleta.
- [ ] Verificar teclado, formularios y scroll en pantallas pequeñas.
- [ ] Añadir manejo global de errores no controlados.
- [ ] Ejecutar lint y typecheck sin errores.
- [ ] Añadir pruebas unitarias a validadores y algoritmo de recomendación.
- [ ] Probar en al menos dos teléfonos Android diferentes.
- [ ] Probar en iOS disponible o documentar la limitación del equipo.
- [ ] Probar web responsive.

Criterio de aceptación: no hay bloqueos funcionales, secretos expuestos ni textos principales sin traducir.

## 16. Fase 13 — Datos, demo y entrega

- [ ] Recopilar 30–50 lugares con fuente verificable.
- [ ] Revisar coordenadas y categorías.
- [ ] Crear descripciones originales en español.
- [ ] Completar traducciones en inglés.
- [ ] Comprimir y atribuir imágenes correctamente.
- [ ] Ejecutar seed final.
- [ ] Crear cuentas demo: usuario y administrador.
- [ ] Preparar datos para mostrar recomendaciones y moderación.
- [ ] Ejecutar colección Postman completa.
- [ ] Crear development build Android si se requiere OAuth Google.
- [ ] Preparar alternativa Expo Go mediante QR/túnel.
- [ ] Verificar Supabase y el proveedor de rutas el día anterior.
- [ ] Preparar guion de presentación y asignar partes al equipo.
- [ ] Grabar video corto de respaldo.
- [ ] Actualizar README con instalación, variables y ejecución.

Criterio de aceptación: la demo se puede realizar con conexión externa y existe un respaldo si falla un dispositivo o servicio.

## 17. Orden crítico recomendado

No comenzar el panel administrativo ni el pulido visual antes de completar esta cadena:

```text
Proyecto Expo
→ Esquema y RLS
→ Datos iniciales
→ Auth email/password
→ Lugares/listado/detalle
→ Mapa y rutas
→ Reseñas/votos/favoritos
→ Admin
→ Recomendaciones
→ Idiomas, QA y demo
```

## 18. Trabajo paralelo para tres personas

### Persona 1 — Frontend y diseño

- Navegación y layouts.
- Componentes visuales.
- Explorar, búsqueda, detalle y perfil.
- Idiomas y accesibilidad.

### Persona 2 — Base de datos y seguridad

- Migraciones, seeds e índices.
- Auth, RLS, Storage y RPC.
- Tests de autorización en Postman.

### Persona 3 — Integraciones y administración

- Mapas, ubicación y rutas.
- Recomendaciones.
- Edge Functions y panel administrativo.

Cada cambio que modifica el contrato de datos debe actualizar primero los documentos de esquema y endpoints.

## 19. Criterio global de terminado

El MVP está terminado cuando:

- [ ] Un invitado explora, busca, filtra y visualiza rutas.
- [ ] Un usuario se registra, inicia sesión y recupera su contraseña.
- [ ] Un usuario gestiona favoritos, reseña, voto, foto, reporte y sugerencia.
- [ ] Un administrador gestiona lugares y modera contenido desde web.
- [ ] Las recomendaciones funcionan para invitados y usuarios.
- [ ] Español e inglés están disponibles.
- [ ] RLS y endpoints superan pruebas negativas en Postman.
- [ ] La ubicación no se almacena.
- [ ] La aplicación se demuestra desde al menos dos dispositivos.
- [ ] README, colección Postman y variables de ejemplo están entregables.

