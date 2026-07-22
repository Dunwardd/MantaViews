# Configuración de autenticación de MantaViews

## Estado actual

- Email y contraseña: habilitado en Supabase Cloud.
- Registro de usuarios: habilitado.
- Confirmación de correo: desactivada para el MVP académico.
- Sesión móvil: persistida con Expo SecureStore.
- Google: implementado y habilitado en Google Cloud y Supabase.

La aplicación usa únicamente la URL del proyecto y la `publishable key`. Ningún secreto de Google ni una `service_role` se guarda en Expo.

## Redirects de autenticación

En Supabase Dashboard, abrir **Authentication → URL Configuration** y agregar:

```text
mantaviews://**
http://localhost:8081/**
```

Para probar enlaces desde Expo Go, iniciar Metro y agregar temporalmente las dos URL exactas que genere el equipo, por ejemplo:

```text
exp://IP_LOCAL:8081/--/auth-callback
exp://IP_LOCAL:8081/--/reset-password
```

La IP puede cambiar. Para una demo estable de Google y recuperación se recomienda un development build, donde se usa el esquema fijo `mantaviews://`.

## Habilitar Google

1. Abrir Google Auth Platform y crear un cliente OAuth 2.0 de tipo **Web application**.
2. Registrar como redirect autorizado de Google:

   ```text
   https://qgrbcnnqcjfwrygkcqrs.supabase.co/auth/v1/callback
   ```

3. En Supabase abrir **Authentication → Sign In / Providers → Google**.
4. Activar Google y pegar el Client ID y Client Secret de Google.
5. Guardar. El Client Secret permanece exclusivamente en Supabase.
6. Reiniciar Expo y probar el botón **Continuar con Google** en web o en un development build.

## Prueba manual de email y contraseña

1. Abrir **Perfil → Crear cuenta**.
2. Registrar nombre, correo y una contraseña de al menos ocho caracteres con letra y número.
3. Comprobar que la aplicación inicia sesión inmediatamente, sin enviar un correo de confirmación.
4. Confirmar que Perfil muestra el nombre y correo.
5. Cerrar y volver a abrir la app: la sesión debe restaurarse.
6. Cerrar sesión: Perfil debe volver al modo invitado.

> La recuperación de contraseña todavía depende de un proveedor SMTP con buena entregabilidad. No forma parte del flujo crítico de la demo mientras no exista un dominio autenticado.

## Prueba del retorno contextual

1. Abrir Favoritos sin sesión.
2. Tocar **Iniciar sesión**.
3. Autenticarse.
4. Confirmar que la app regresa automáticamente a Favoritos.
