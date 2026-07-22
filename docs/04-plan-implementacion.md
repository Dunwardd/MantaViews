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

- [x] Crear proyecto Expo con TypeScript y Expo Router.
- [x] Mantener rutas únicamente en `src/app`.
- [x] Crear carpetas `components`, `screens`, `features`, `services`, `hooks`, `utils`, `theme`, `i18n` y `types`.
- [x] Configurar alias `@/*` hacia `src/*`.
- [x] Configurar ESLint, Prettier y scripts de verificación.
- [x] Añadir `.env.example` sin secretos.
- [x] Añadir `.env*`, credenciales y archivos locales sensibles a `.gitignore`.
- [x] Instalar dependencias compatibles usando `npx expo install` cuando corresponda.
- [x] Configurar TanStack Query con caché y reintentos controlados.
- [x] Configurar Supabase client y persistencia segura de sesión.
- [x] Confirmar que el proyecto abre en Expo Go sobre un dispositivo Android físico.
- [ ] Confirmar que el proyecto abre en un dispositivo iOS disponible.
- [x] Confirmar que Expo Web compila.

Criterio de aceptación: app vacía ejecutándose en móvil y web, lint/typecheck exitosos y ningún secreto versionado.

## 5. Fase 2 — Base de datos Supabase

- [x] Crear proyecto Supabase Cloud en South America (São Paulo).
- [x] Vincular la CLI local con el proyecto cloud `MantaViews`.
- [x] Inicializar Supabase CLI como dependencia local y versionar `supabase/config.toml`.
- [x] Habilitar `postgis`, `pgcrypto` y `pg_trgm` mediante migración.
- [x] Crear migración de enums.
- [x] Crear tablas de usuarios: `profiles`, `user_roles`, `user_interests`.
- [x] Crear tablas de catálogo: `categories`, `category_translations`.
- [x] Crear tablas de lugares: `places`, `place_translations`, `place_images`.
- [x] Crear tablas sociales: `reviews`, `favorites`, `tourist_votes`.
- [x] Crear tablas de comunidad: `place_suggestions`, `reports`.
- [x] Crear `admin_audit_logs`.
- [x] Añadir claves foráneas, checks y restricciones unique.
- [x] Crear índices B-tree, GiST y trigram.
- [x] Crear trigger reutilizable de `updated_at`.
- [x] Crear trigger de perfil/rol al registrarse un usuario.
- [x] Crear vista `place_stats` con `security_invoker`.
- [x] Crear función protegida `is_admin`.
- [x] Crear RPC `search_places`.
- [x] Crear RPC `nearby_places`.
- [x] Crear RPC `get_place_detail`.
- [x] Crear RPC `get_recommendations`.
- [x] Sembrar nueve categorías en español e inglés.
- [x] Publicar las migraciones y el seed bilingüe en Supabase Cloud.
- [ ] Crear usuario administrador inicial de forma segura.
- [x] Ejecutar migraciones y seed desde una base local limpia para validar reproducibilidad.
- [x] Ejecutar 18 pruebas SQL, incluida una prueba de distancia PostGIS.
- [x] Ejecutar lint sobre los esquemas propios `public` y `private` sin errores.
- [x] Confirmar que el historial de migraciones local y cloud coincide.

Criterio de aceptación: esquema recreable, restricciones comprobadas y consultas geográficas devolviendo distancias correctas.

## 6. Fase 3 — Seguridad, RLS y Storage

- [x] Activar RLS explícitamente en todas las tablas públicas.
- [x] Crear políticas de lectura pública para contenido publicado.
- [x] Crear políticas de lectura/escritura del perfil propio.
- [x] Crear políticas de reseñas propias.
- [x] Crear políticas de favoritos propios.
- [x] Crear políticas de votos propios.
- [x] Crear políticas de intereses propios.
- [x] Crear políticas de sugerencias y reportes propios.
- [x] Bloquear escrituras del cliente en `user_roles` y auditoría.
- [x] Crear políticas administrativas usando `is_admin`.
- [x] Crear buckets `avatars` y `place-images`.
- [x] Limitar rutas de Storage por `user_id`.
- [x] Limitar MIME y tamaño máximo de imágenes.
- [x] Verificar que `service_role` no esté en `.env` público ni en el repositorio.
- [x] Probar acceso invitado, usuario A, usuario B y administrador.
- [x] Publicar la migración de seguridad y Storage en Supabase Cloud.
- [x] Confirmar historial local/cloud y lint remoto sin errores.

Criterio de aceptación: un usuario no puede leer ni modificar recursos privados de otro, y ningún cliente puede asignarse privilegios.

## 7. Fase 4 — Autenticación

- [x] Configurar registro por correo y contraseña.
- [x] Desactivar la confirmación obligatoria de correo para el MVP académico.
- [x] Implementar login y cierre de sesión.
- [x] Implementar recuperación y cambio de contraseña.
- [x] Restaurar/refrescar sesión al abrir la app.
- [x] Crear provider/hook de sesión.
- [x] Implementar rutas protegidas y guard de acciones contextuales.
- [x] Configurar Google OAuth en Supabase.
- [x] Configurar esquema y redirect URI para development build/web.
- [x] Probar Google OAuth fuera de Expo Go.
- [x] Limpiar caché privada al cerrar sesión.
- [x] Verificar en Cloud que email y registro están habilitados y **Confirm email** está desactivado.
- [x] Documentar que el SMTP y la recuperación por correo quedan fuera del flujo crítico del MVP.
- [x] Verificar que un usuario nuevo recibe una sesión inmediatamente después del registro.
- [x] Validar visualmente login, registro, guard y perfil invitado en web.

Criterio de aceptación: email/password completo y sesión persistente; Google probado en una plataforma de presentación si forma parte del MVP.

## 8. Fase 5 — Backend y endpoints

- [x] Definir validaciones Zod compartidas para bodies y parámetros.
- [x] Verificar endpoints Auth en Postman.
- [x] Verificar Data API pública para categorías y lugares.
- [x] Verificar RPC de búsqueda, detalle y cercanía.
- [x] Verificar CRUD de perfil e intereses.
- [x] Verificar CRUD de reseñas, favoritos y votos.
- [x] Verificar sugerencias, imágenes y reportes.
- [x] Implementar y desplegar Edge Function `route-preview`.
- [x] Configurar Valhalla sobre OpenStreetMap como proveedor sin clave API.
- [x] Verificar una ruta real con Valhalla después del despliegue.
- [x] Normalizar errores del proveedor externo.
- [x] Implementar timeout y límites de solicitudes para rutas.
- [x] Implementar Edge Function `admin-places`.
- [x] Implementar Edge Function `admin-suggestions`/`review-suggestion`.
- [x] Implementar Edge Function `moderate-content`.
- [x] Implementar Edge Function `admin-reports`/`resolve-report`.
- [x] Registrar acciones administrativas en auditoría.
- [x] Crear y exportar colección Postman sin secretos.
- [x] Crear entorno Postman de ejemplo.
- [x] Añadir tests automáticos de éxito, validación, autenticación y autorización en Postman.
- [x] Ejecutar la colección completa: 49 solicitudes y 53 aserciones sin fallos.
- [x] Revisar asesores de seguridad y rendimiento de Supabase.
- [x] Restringir la función interna de RLS y evitar el listado público de avatares.
- [x] Añadir índices para las claves foráneas detectadas por el asesor.

Criterio de aceptación: la colección Postman cubre casos exitosos, validación, autenticación y autorización.

Nota de seguridad: el asesor conserva únicamente el aviso de protección contra contraseñas filtradas. Supabase ofrece esa comprobación desde el plan Pro, por lo que se documenta como mejora futura y no como requisito del MVP gratuito.

## 9. Fase 6 — Base visual y navegación frontend

- [x] Crear tokens de color según la identidad MantaViews.
- [x] Definir tipografía, espaciado, radios y sombras.
- [x] Preparar logo e icono definitivos.
- [x] Implementar componentes base: botón, input, tarjeta, chip, rating, avatar y estados.
- [x] Implementar componentes de carga, vacío y error.
- [x] Crear root layout con proveedores de sesión, Query y traducción.
- [x] Crear tabs: Explorar, Mapa, Favoritos y Perfil.
- [x] Crear stacks y rutas modales.
- [x] Verificar safe areas y tamaños de pantalla.
- [x] Verificar contraste, labels accesibles y tamaño táctil.

Criterio de aceptación: navegación completa con pantallas placeholder y diseño consistente en Android, iOS y web.

## 10. Fase 7 — Experiencia pública

- [x] Implementar onboarding e idioma inicial.
- [x] Implementar pantalla Explorar.
- [x] Mostrar categorías desde Supabase Cloud.
- [x] Mostrar lugares destacados desde Supabase Cloud.
- [x] Integrar recomendaciones para invitado.
- [x] Implementar búsqueda con debounce.
- [x] Implementar filtro por categoría.
- [x] Implementar filtros por distancia y valoración.
- [x] Implementar listado paginado.
- [x] Implementar detalle del lugar.
- [x] Mostrar portada, galería, horario y contacto.
- [x] Mostrar estadísticas agregadas del lugar.
- [x] Mostrar reseñas publicadas.
- [x] Añadir enlaces externos seguros para ruta y sitio web.
- [x] Añadir la acción de compartir.
- [x] Verificar estados de carga, vacío, error y reintento.

Criterio de aceptación: un invitado puede descubrir un lugar desde inicio o búsqueda y consultar toda su información publicada.

## 11. Fase 8 — Mapa, ubicación y rutas

- [x] Instalar y configurar `react-native-maps`.
- [x] Crear mapa web real con Leaflet y OpenStreetMap.
- [x] Mostrar región inicial de Manta.
- [x] Renderizar marcadores por categoría.
- [x] Mostrar tarjeta al seleccionar un marcador.
- [x] Solicitar ubicación solo al usar funciones cercanas.
- [x] Gestionar permiso concedido, rechazado y bloqueado.
- [x] Consultar lugares cercanos con PostGIS.
- [x] Llamar `route-preview`.
- [x] Dibujar polilínea, distancia y duración.
- [x] Añadir botón para abrir Google Maps/Waze.
- [x] Confirmar mediante logs y revisión que la ubicación no se persiste.
- [x] Verificar en la app una ruta real servida por Valhalla.

Criterio de aceptación: el usuario ve lugares y una ruta; la app sigue funcionando sin conceder ubicación.

## 12. Fase 9 — Funciones de usuario

- [x] Implementar perfil y edición de idioma/nombre/avatar.
- [x] Implementar selección de intereses.
- [x] Implementar agregar/quitar favoritos.
- [x] Implementar listado de favoritos.
- [x] Implementar crear/editar/archivar reseña.
- [x] Impedir doble envío de formularios.
- [x] Implementar voto turístico mediante upsert.
- [x] Implementar sugerencia de nuevo lugar.
- [x] Mostrar estado de sugerencias propias.
- [x] Implementar reportes.
- [x] Implementar selección, compresión y subida de imágenes.
- [x] Mostrar estado pendiente de moderación.
- [x] Reanudar acción después del login contextual.

Criterio de aceptación: todas las escrituras requieren sesión, actualizan caché correctamente y respetan propiedad/RLS.

## 13. Fase 10 — Recomendaciones

- [x] Definir pesos finales del algoritmo y documentarlos.
- [x] Implementar fallback popular/diverso para invitados.
- [x] Integrar intereses del usuario.
- [x] Integrar valoración y popularidad.
- [x] Integrar distancia solo cuando se otorgue permiso.
- [x] Excluir lugares archivados o rechazados.
- [x] Evitar resultados repetitivos de una sola categoría.
- [x] Explicar brevemente “Por qué se recomienda”.
- [x] Probar usuario nuevo, usuario sin intereses y usuario activo.

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

- [x] Cargar un catálogo técnico inicial de 8 lugares con traducciones y coordenadas verificadas.
- [ ] Recopilar 30–50 lugares con fuente verificable.
- [ ] Revisar coordenadas y categorías.
- [ ] Crear descripciones originales en español.
- [ ] Completar traducciones en inglés.
- [ ] Comprimir y atribuir imágenes correctamente.
- [ ] Ejecutar seed final.
- [ ] Crear cuentas demo: usuario y administrador.
- [ ] Preparar datos para mostrar recomendaciones y moderación.
- [x] Ejecutar colección Postman completa para el backend de la fase 5.
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
- [x] RLS y endpoints superan pruebas negativas en Postman.
- [ ] La ubicación no se almacena.
- [ ] La aplicación se demuestra desde al menos dos dispositivos.
- [x] README, colección Postman y variables de ejemplo están entregables.
