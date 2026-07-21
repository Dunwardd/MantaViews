# MantaViews

Aplicación turística de Manta, Manabí, construida con Expo, React Native, Expo Router y Supabase.

El proyecto usa intencionalmente Expo SDK 54 porque es la versión indicada actualmente para probar proyectos desde Expo Go en teléfonos físicos.

## Requisitos

- Node.js 22 o compatible.
- Expo Go para las primeras pruebas móviles.
- Un proyecto Supabase para habilitar datos y autenticación.

## Configuración local

```bash
npm install
copy .env.example .env
npm run start
```

El teléfono y la computadora deben estar en la misma red. Si la red local bloquea la conexión, prueba:

```bash
npm run start:tunnel
```

Completa en `.env` la URL y la publishable key de Supabase. Nunca coloques la `service_role` en la aplicación.

## Verificaciones

```bash
npm run typecheck
npm run lint
npm run web:export
```

La documentación de arquitectura y el seguimiento del proyecto están en [`docs/`](./docs/).
