# Fase 9 — Funciones de usuario

## Resultado

MantaViews permite explorar sin cuenta y solicita autenticación únicamente al guardar, votar, reseñar, subir fotografías, reportar o sugerir lugares. Después del acceso por contraseña o Google, el usuario regresa a la pantalla donde inició la acción.

## Funciones implementadas

- Edición de nombre visible, idioma y avatar.
- Selección de categorías de interés para recomendaciones.
- Agregar, quitar y listar lugares favoritos.
- Crear, editar y archivar una reseña por lugar.
- Votar si un lugar es turístico mediante `upsert`.
- Seleccionar, redimensionar y comprimir imágenes antes de subirlas.
- Fotografías de usuarios registradas con estado `pending` y sin posibilidad de autopublicación.
- Crear sugerencias de lugares con categoría, coordenadas y evidencia opcional.
- Consultar el estado y las notas de revisión de sugerencias propias.
- Reportar lugares con motivo y detalles opcionales.

## Seguridad y datos

Todas las escrituras usan la sesión de Supabase y la clave pública del cliente. Las políticas RLS validan propiedad mediante `auth.uid()`, estados permitidos y lugares publicados. Los archivos se almacenan bajo una ruta cuyo primer segmento es el UUID del usuario. No se incluye ninguna clave secreta ni `service_role` en la aplicación.

Las mutaciones deshabilitan sus botones mientras están pendientes para evitar doble envío. Después de cada escritura se invalidan únicamente las consultas relacionadas en TanStack Query.

## Imágenes

`expo-image-picker` solicita acceso a la galería solo cuando el usuario decide seleccionar una imagen. `expo-image-manipulator` redimensiona y comprime el archivo a JPEG antes de subirlo. Los avatares se guardan en `avatars`; las fotografías turísticas se guardan en `place-images` y requieren moderación.

## Verificación

- TypeScript, ESLint, Prettier y `git diff --check` sin errores.
- Ocho tablas de usuario verificadas en el proyecto cloud con RLS y políticas activas.
- El asesor de seguridad de Supabase no reporta vulnerabilidades de RLS en estas funciones.
- Exportación de Android, iOS y web ejecutada para comprobar resolución de módulos.

## Observación de seguridad

Supabase mantiene una recomendación de configuración externa: activar la protección contra contraseñas filtradas en Auth. No bloquea esta fase y se habilita desde el panel cuando el plan del proyecto lo permita.
