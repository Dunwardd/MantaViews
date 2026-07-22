# Base de datos local de MantaViews

Esta carpeta contiene la fuente de verdad de la base de datos. Los cambios de esquema se realizan mediante nuevas migraciones; no se modifica una base cloud manualmente sin reflejar el cambio aquí.

## Requisitos

- Node.js y dependencias instaladas con `npm install`.
- Docker Desktop iniciado.

## Flujo local

```bash
npm run supabase:start
npm run db:reset
npm run db:test
npm run db:lint
```

Resultados esperados:

- `db:reset` aplica las migraciones y `seed.sql` desde una base vacía.
- `db:test` ejecuta 60 pruebas y termina con `Result: PASS`.
- `db:lint` termina con `No schema errors found` para `public` y `private`.

Para detener los contenedores:

```bash
npm run supabase:stop
```

## Archivos

- `migrations/20260721000100_phase2_schema.sql`: extensiones, enums, tablas, restricciones, índices y triggers.
- `migrations/20260721000200_phase2_read_models.sql`: vista agregada y RPC de lectura.
- `migrations/20260721000300_phase3_security_storage.sql`: privilegios mínimos, RLS, proyecciones seguras y políticas de Storage.
- `migrations/20260722024900_fix_suggestion_review_state.sql`: conserva un estado de revisión válido aunque se elimine la cuenta del administrador.
- `migrations/20260722025412_harden_rls_trigger_and_avatar_bucket.sql`: restringe la función interna de RLS y evita enumerar avatares.
- `migrations/20260722025616_add_foreign_key_indexes.sql`: cubre las claves foráneas usadas por joins, borrados y políticas.
- `functions/`: validaciones Zod compartidas y las siete Edge Functions de rutas y administración.
- `seed.sql`: nueve categorías turísticas con traducciones `es` y `en`.
- `tests/database/phase2.sql`: pruebas pgTAP de estructura, seed y distancia geográfica.
- `tests/database/phase3.sql`: pruebas pgTAP de aislamiento para invitado, usuarios y administrador.

Los puntos PostGIS siempre se construyen en el orden `longitud, latitud`.

## Publicación en Supabase Cloud

Después de crear el proyecto cloud desde la cuenta del equipo:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push --include-seed
```

No se debe versionar la contraseña de la base, la `service_role key` ni ningún token de acceso.

## Edge Functions

Las funciones usan el import map versionado en `functions/deno.json`. Para desplegarlas:

```bash
npx supabase functions deploy route-preview admin-places admin-suggestions review-suggestion moderate-content admin-reports resolve-report --project-ref TU_PROJECT_REF --use-api --import-map supabase/functions/deno.json
```

La vista previa de ruta usa el servidor público de Valhalla sobre datos de OpenStreetMap. No requiere clave API y se identifica mediante el encabezado `X-Client-Id: MantaViews-academic`. Su uso está limitado a pruebas académicas y tráfico bajo; una publicación con usuarios reales debe usar una instancia propia o coordinar el acceso con Valhalla.

## Primer administrador

El administrador no forma parte del seed. Primero se registra el usuario normalmente; luego, desde el SQL Editor del proyecto cloud y con acceso de propietario, se ejecuta una promoción explícita:

```sql
update public.user_roles
set role = 'admin',
    assigned_at = now(),
    assigned_by = user_id
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('CORREO_DEL_ADMIN')
);
```

Verificar que el comando modificó exactamente una fila. La aplicación móvil nunca recibe permiso para modificar `user_roles`.
