# MantaViews — Endpoints y pruebas con Postman

## 1. Estrategia de API

El backend combina:

1. **Supabase Auth API** para registro, login, recuperación y sesiones.
2. **Supabase Data API** para CRUD protegido por Row Level Security.
3. **Funciones RPC PostgreSQL** para consultas geográficas y agregadas.
4. **Supabase Edge Functions** para secretos externos y operaciones administrativas transaccionales.

No se usa `service_role` desde Postman ni desde la aplicación. Las pruebas administrativas usan el JWT de una cuenta con rol `admin`.

## 2. Variables del entorno Postman

```text
supabase_url=https://<project-ref>.supabase.co
publishable_key=<SUPABASE_PUBLISHABLE_KEY>
access_token=<JWT_DE_USUARIO>
admin_access_token=<JWT_DE_ADMIN>
user_id=<UUID_USUARIO>
place_id=<UUID_LUGAR>
review_id=<UUID_RESENA>
suggestion_id=<UUID_SUGERENCIA>
```

Headers generales:

```http
apikey: {{publishable_key}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
Accept-Language: es
```

Para operaciones que deben devolver el registro creado o modificado:

```http
Prefer: return=representation
```

Para `upsert`:

```http
Prefer: resolution=merge-duplicates,return=representation
```

## 3. Respuestas y errores

- `200 OK`: lectura o actualización exitosa.
- `201 Created`: recurso creado.
- `204 No Content`: eliminación lógica/física de relación exitosa.
- `400 Bad Request`: cuerpo o parámetros inválidos.
- `401 Unauthorized`: JWT ausente, inválido o expirado.
- `403 Forbidden`: RLS o rol insuficiente.
- `404 Not Found`: recurso inexistente o no visible para el usuario.
- `409 Conflict`: duplicado, por ejemplo una segunda reseña.
- `422 Unprocessable Entity`: validación semántica.
- `429 Too Many Requests`: límite de solicitudes.
- `500/502`: fallo interno o del servicio externo.

Formato esperado de error en Edge Functions:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": {}
  }
}
```

## 4. Autenticación

### AUTH-01 — Registrar usuario

`POST {{supabase_url}}/auth/v1/signup`

Autenticación: pública; enviar `apikey`.

```json
{
  "email": "turista@example.com",
  "password": "UnaClaveSegura123!",
  "data": {
    "display_name": "Turista Manta"
  }
}
```

Validar: correo duplicado, clave inválida y creación automática de `profiles`/`user_roles`.

### AUTH-02 — Iniciar sesión con correo y contraseña

`POST {{supabase_url}}/auth/v1/token?grant_type=password`

```json
{
  "email": "turista@example.com",
  "password": "UnaClaveSegura123!"
}
```

Script Postman posterior a la respuesta:

```javascript
const body = pm.response.json();
pm.environment.set('access_token', body.access_token);
pm.environment.set('user_id', body.user.id);
```

### AUTH-03 — Refrescar sesión

`POST {{supabase_url}}/auth/v1/token?grant_type=refresh_token`

```json
{
  "refresh_token": "<refresh-token>"
}
```

### AUTH-04 — Cerrar sesión

`POST {{supabase_url}}/auth/v1/logout`

Autenticación: usuario.

### AUTH-05 — Solicitar recuperación de contraseña

`POST {{supabase_url}}/auth/v1/recover`

```json
{
  "email": "turista@example.com"
}
```

### AUTH-06 — Inicio con Google

`GET {{supabase_url}}/auth/v1/authorize?provider=google&redirect_to={{redirect_url}}`

Este flujo se valida mejor desde web o development build porque requiere navegador y redirección OAuth; Postman solo puede comprobar el inicio del redirect.

## 5. Perfil e intereses

### USER-01 — Obtener perfil propio

`GET {{supabase_url}}/rest/v1/profiles?id=eq.{{user_id}}&select=*`

Autenticación: usuario.

### USER-02 — Actualizar perfil propio

`PATCH {{supabase_url}}/rest/v1/profiles?id=eq.{{user_id}}`

```json
{
  "display_name": "Edward",
  "preferred_language": "es"
}
```

No se admite actualizar roles.

### USER-03 — Listar intereses propios

`GET {{supabase_url}}/rest/v1/user_interests?user_id=eq.{{user_id}}&select=category_id,weight,categories(slug)`

### USER-04 — Guardar o actualizar interés

`POST {{supabase_url}}/rest/v1/user_interests?on_conflict=user_id,category_id`

```json
{
  "user_id": "{{user_id}}",
  "category_id": 1,
  "weight": 5
}
```

### USER-05 — Eliminar interés

`DELETE {{supabase_url}}/rest/v1/user_interests?user_id=eq.{{user_id}}&category_id=eq.1`

## 6. Categorías y lugares públicos

### CAT-01 — Listar categorías activas traducidas

`GET {{supabase_url}}/rest/v1/categories?is_active=eq.true&select=id,slug,icon,color,sort_order,category_translations(locale,name)&order=sort_order.asc`

Autenticación: pública.

### PLACE-01 — Listar lugares publicados

`GET {{supabase_url}}/rest/v1/places?status=eq.published&select=id,category_id,address,location,is_featured,place_translations(locale,name,short_description),place_images(storage_path,is_cover)&order=is_featured.desc&limit=20&offset=0`

Autenticación: pública.

### PLACE-02 — Filtrar por categoría

`GET {{supabase_url}}/rest/v1/places?status=eq.published&category_id=eq.{{category_id}}&select=*&limit=20&offset=0`

### PLACE-03 — Buscar lugares

`POST {{supabase_url}}/rest/v1/rpc/search_places`

```json
{
  "query_text": "playa",
  "category_slug": null,
  "requested_locale": "es",
  "page_size": 20,
  "page_offset": 0
}
```

Validar: búsqueda vacía, texto parcial, acentos, idioma y paginación máxima.

### PLACE-04 — Obtener lugares cercanos

`POST {{supabase_url}}/rest/v1/rpc/nearby_places`

```json
{
  "user_latitude": -0.9538,
  "user_longitude": -80.7331,
  "radius_meters": 5000,
  "category_filter": null,
  "requested_locale": "es",
  "result_limit": 30
}
```

La función recibe la ubicación, responde y no la persiste.

### PLACE-05 — Obtener detalle de un lugar

`POST {{supabase_url}}/rest/v1/rpc/get_place_detail`

```json
{
  "requested_place_id": "{{place_id}}",
  "requested_locale": "es"
}
```

Respuesta esperada: información traducida, categoría, coordenadas, horarios, portada, galería y estadísticas.

## 7. Reseñas

### REVIEW-01 — Listar reseñas publicadas

`GET {{supabase_url}}/rest/v1/reviews?place_id=eq.{{place_id}}&status=eq.published&select=id,rating,comment,created_at,profiles(display_name,avatar_path)&order=created_at.desc&limit=20&offset=0`

Autenticación: pública.

### REVIEW-02 — Crear reseña

`POST {{supabase_url}}/rest/v1/reviews`

Autenticación: usuario.

```json
{
  "place_id": "{{place_id}}",
  "user_id": "{{user_id}}",
  "rating": 5,
  "comment": "Excelente lugar para visitar al atardecer."
}
```

### REVIEW-03 — Editar reseña propia

`PATCH {{supabase_url}}/rest/v1/reviews?id=eq.{{review_id}}&user_id=eq.{{user_id}}`

```json
{
  "rating": 4,
  "comment": "Muy bonito, aunque estuvo concurrido."
}
```

### REVIEW-04 — Archivar reseña propia

`PATCH {{supabase_url}}/rest/v1/reviews?id=eq.{{review_id}}&user_id=eq.{{user_id}}`

```json
{
  "status": "archived"
}
```

## 8. Favoritos y votos

### FAV-01 — Listar favoritos

`GET {{supabase_url}}/rest/v1/favorites?user_id=eq.{{user_id}}&select=created_at,places(*)&order=created_at.desc`

### FAV-02 — Agregar favorito

`POST {{supabase_url}}/rest/v1/favorites`

```json
{
  "user_id": "{{user_id}}",
  "place_id": "{{place_id}}"
}
```

### FAV-03 — Quitar favorito

`DELETE {{supabase_url}}/rest/v1/favorites?user_id=eq.{{user_id}}&place_id=eq.{{place_id}}`

### VOTE-01 — Crear o cambiar voto turístico

`POST {{supabase_url}}/rest/v1/tourist_votes?on_conflict=user_id,place_id`

```json
{
  "user_id": "{{user_id}}",
  "place_id": "{{place_id}}",
  "is_touristic": true
}
```

### VOTE-02 — Eliminar voto propio

`DELETE {{supabase_url}}/rest/v1/tourist_votes?user_id=eq.{{user_id}}&place_id=eq.{{place_id}}`

## 9. Sugerencias, imágenes y reportes

### SUG-01 — Proponer lugar

`POST {{supabase_url}}/rest/v1/place_suggestions`

```json
{
  "submitted_by": "{{user_id}}",
  "category_id": 1,
  "name": "Mirador de ejemplo",
  "description": "Descripción verificable del sitio propuesto.",
  "address": "Manta, Manabí",
  "location": "POINT(-80.7331 -0.9538)",
  "evidence_url": null
}
```

### SUG-02 — Listar sugerencias propias

`GET {{supabase_url}}/rest/v1/place_suggestions?submitted_by=eq.{{user_id}}&select=*&order=created_at.desc`

### IMG-01 — Subir archivo de imagen

`POST {{supabase_url}}/storage/v1/object/place-images/{{user_id}}/{{file_uuid}}.webp`

Headers adicionales:

```http
Content-Type: image/webp
x-upsert: false
```

Body: binary. Luego registrar sus metadatos con IMG-02.

### IMG-02 — Registrar imagen pendiente

`POST {{supabase_url}}/rest/v1/place_images`

```json
{
  "place_id": "{{place_id}}",
  "review_id": null,
  "uploader_id": "{{user_id}}",
  "storage_path": "{{user_id}}/{{file_uuid}}.webp",
  "alt_text": "Vista de la playa al atardecer"
}
```

### IMG-03 — Crear URL firmada de una imagen autorizada

`POST {{supabase_url}}/storage/v1/object/sign/place-images/{{storage_path}}`

```json
{
  "expiresIn": 3600
}
```

El bucket es privado. La política de Storage solo permite firmar imágenes publicadas o imágenes pendientes pertenecientes al usuario actual.

### REPORT-01 — Reportar contenido

`POST {{supabase_url}}/rest/v1/reports`

```json
{
  "reporter_id": "{{user_id}}",
  "target_type": "place",
  "target_id": "{{place_id}}",
  "reason": "incorrect_information",
  "details": "El horario publicado ya no es correcto."
}
```

## 10. Recomendaciones y rutas

### REC-01 — Obtener recomendaciones

`POST {{supabase_url}}/rest/v1/rpc/get_recommendations`

Autenticación: opcional. Con JWT usa intereses, favoritos y reseñas; sin sesión devuelve una selección popular y diversa.

```json
{
  "requested_locale": "es",
  "user_latitude": -0.9538,
  "user_longitude": -80.7331,
  "result_limit": 10
}
```

La función obtiene el usuario exclusivamente desde `auth.uid()`; nunca confía en un `user_id` enviado por el cliente. Las coordenadas se usan solo durante la consulta.

### ROUTE-01 — Obtener vista previa de ruta

`POST {{supabase_url}}/functions/v1/route-preview`

```json
{
  "origin": {
    "latitude": -0.9538,
    "longitude": -80.7331
  },
  "destination": {
    "latitude": -0.9446,
    "longitude": -80.7282
  },
  "profile": "foot-walking"
}
```

Respuesta normalizada:

```json
{
  "distanceMeters": 1840,
  "durationSeconds": 1420,
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-80.7331, -0.9538],
      [-80.7282, -0.9446]
    ]
  }
}
```

La Edge Function protege la clave externa, valida que las coordenadas estén en un rango razonable y no registra el body.

## 11. Administración

Todos estos endpoints requieren `Authorization: Bearer {{admin_access_token}}` y verifican el rol en servidor.

### ADMIN-PLACE-01 — Listar lugares para administración

`GET {{supabase_url}}/functions/v1/admin-places?status=pending&limit=20&offset=0`

### ADMIN-PLACE-02 — Crear lugar completo

`POST {{supabase_url}}/functions/v1/admin-places`

```json
{
  "categoryId": 1,
  "latitude": -0.9538,
  "longitude": -80.7331,
  "address": "Manta, Manabí",
  "phone": null,
  "websiteUrl": null,
  "priceLevel": 0,
  "isFeatured": true,
  "status": "published",
  "translations": {
    "es": {
      "name": "Lugar de ejemplo",
      "shortDescription": "Descripción corta",
      "description": "Descripción completa"
    },
    "en": {
      "name": "Example place",
      "shortDescription": "Short description",
      "description": "Full description"
    }
  }
}
```

La función inserta lugar y traducciones en una sola transacción lógica.

### ADMIN-PLACE-03 — Editar lugar completo

`PATCH {{supabase_url}}/functions/v1/admin-places/{{place_id}}`

### ADMIN-PLACE-04 — Archivar lugar

`DELETE {{supabase_url}}/functions/v1/admin-places/{{place_id}}`

El método `DELETE` cambia el estado a `archived`; no elimina físicamente.

### ADMIN-SUG-01 — Listar sugerencias pendientes

`GET {{supabase_url}}/functions/v1/admin-suggestions?status=pending`

### ADMIN-SUG-02 — Aprobar o rechazar sugerencia

`POST {{supabase_url}}/functions/v1/review-suggestion`

```json
{
  "suggestionId": "{{suggestion_id}}",
  "decision": "approve",
  "notes": "Información verificada"
}
```

Al aprobar, la función crea el lugar pendiente o publicado y registra auditoría.

### ADMIN-MOD-01 — Moderar contenido

`POST {{supabase_url}}/functions/v1/moderate-content`

```json
{
  "targetType": "review",
  "targetId": "{{review_id}}",
  "decision": "reject",
  "notes": "Contenido inapropiado"
}
```

### ADMIN-REPORT-01 — Listar reportes

`GET {{supabase_url}}/functions/v1/admin-reports?status=open`

### ADMIN-REPORT-02 — Resolver reporte

`POST {{supabase_url}}/functions/v1/resolve-report`

```json
{
  "reportId": "{{report_id}}",
  "resolution": "resolved",
  "moderationAction": "none"
}
```

## 12. Orden mínimo de pruebas en Postman

1. AUTH-01 y AUTH-02.
2. CAT-01 y PLACE-01 como invitado.
3. USER-01 y USER-02 con JWT.
4. PLACE-03, PLACE-04 y PLACE-05.
5. REVIEW-02, REVIEW-03 y el caso duplicado `409`.
6. FAV-02/FAV-03 y VOTE-01/VOTE-02.
7. SUG-01 y REPORT-01.
8. REC-01 y ROUTE-01.
9. Repetir endpoints admin primero con JWT normal (`403`) y luego con JWT admin (`200`).
10. Repetir endpoints privados sin JWT (`401` o respuesta bloqueada por RLS).

## 13. Pruebas de seguridad obligatorias

- Intentar editar el perfil de otro usuario.
- Intentar usar otro `user_id` en favoritos, votos y reseñas.
- Intentar asignarse el rol `admin`.
- Intentar leer sugerencias o reportes ajenos.
- Intentar publicar directamente una imagen pendiente.
- Enviar rating 0 y 6, textos demasiado largos y coordenadas inválidas.
- Probar UUID inexistentes y recursos archivados.
- Confirmar que ninguna respuesta contiene claves secretas.
