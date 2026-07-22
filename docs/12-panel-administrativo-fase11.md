# Fase 11 — Panel administrativo web

## Resultado

El panel está disponible en `/admin` y centraliza la gestión del catálogo sin depender del Dashboard de Supabase.

Incluye:

- resumen de lugares, sugerencias, imágenes y reportes pendientes;
- búsqueda, filtros, creación y edición bilingüe de lugares;
- selector de coordenadas sobre OpenStreetMap;
- publicación y archivado lógico de lugares;
- aprobación o rechazo de sugerencias;
- moderación de reseñas e imágenes;
- resolución o descarte de reportes;
- confirmación previa y bloqueo de doble envío en acciones sensibles.

Los administradores también ven un acceso directo al panel desde su perfil.

## Seguridad

La ruta comprueba primero la sesión y después el rol mediante `is_admin()`. Una cuenta sin el rol `admin` es redirigida al perfil. Las lecturas siguen las políticas RLS y las escrituras administrativas pasan por Edge Functions que vuelven a validar el JWT y el rol con `requireAdmin`.

La clave `service_role` permanece únicamente en Supabase. Cada mutación administrativa registra la acción en `admin_audit_logs`; el cliente nunca escribe directamente en esa tabla.

## Verificación realizada

- Las siete Edge Functions requeridas están activas en el proyecto cloud.
- La cuenta cloud existente conserva el rol `user`; no se elevó ningún permiso durante la prueba.
- La navegación directa a `/admin` sin una sesión administrativa redirige a `/sign-in?next=/admin`.
- El mapa administrativo tiene implementación web y un fallback explícito en móvil.
- TypeScript, ESLint, Prettier y la exportación de Expo se ejecutan como controles de entrega.

## Requisito para operar el panel

Antes de la demostración debe existir al menos una cuenta con una fila `admin` en `public.user_roles`. Esa asignación debe realizarse deliberadamente desde un entorno administrativo; registrarse en la aplicación nunca concede ese rol.

## Alcance de las pruebas

La verificación de interfaz no creó, publicó, archivó ni moderó contenido real. Las mutaciones reutilizan las Edge Functions de la fase 5, previamente protegidas y auditadas.
