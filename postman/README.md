# Pruebas Postman de MantaViews

## Preparación

1. Importar `MantaViews.postman_collection.json`.
2. Importar `MantaViews.postman_environment.example.json`.
3. Duplicar el entorno importado para mantener el archivo de ejemplo sin credenciales.
4. Copiar la **publishable key** de Supabase en `publishable_key`.
5. Definir `test_email` y `test_password` para una cuenta exclusiva de pruebas.
6. Definir `admin_email` y `admin_password` con una cuenta que tenga el rol `admin` en `public.user_roles`.
7. En `image_file_path`, seleccionar una imagen local pequeña para probar Storage.
8. Seleccionar el entorno y ejecutar la colección completa con el Collection Runner.

Los scripts guardan automáticamente tokens, identificadores y registros temporales en el entorno. Nunca copies la `secret key` ni una contraseña real al archivo de ejemplo.

## Orden recomendado

1. Auth: registro, login, sesión, refresh y logout.
2. API pública: categorías, lugares, búsqueda, cercanía y recomendaciones.
3. Usuario autenticado: perfil, intereses y comprobaciones negativas de RLS.
4. CRUD protegido: reseñas, favoritos, votos, sugerencias, reportes e imágenes.
5. Edge Functions: ruta y todas las operaciones administrativas.
6. Limpieza de sesiones.

La colección contiene 49 solicitudes. El 21 de julio de 2026 se ejecutaron 53 aserciones contra el proyecto cloud, todas sin fallos. Los usuarios y registros desechables usados en esa verificación fueron eliminados después de la prueba.

`ROUTE-01` debe responder `200` mediante Valhalla y no necesita una clave externa. Conviene repetir esa solicitud antes de una demostración porque el proveedor público aplica límites de uso razonable.

## Catálogo actual

El proyecto cloud tiene nueve categorías y ocho lugares iniciales publicados. `PLACE-01` guarda automáticamente el primer identificador en `place_id`, por lo que después se pueden ejecutar las solicitudes de detalle, favoritos y reseñas.

No guardar la secret key de Supabase, claves SMTP, contraseñas reales ni JWT personales dentro de archivos versionados.
