import { FunctionsHttpError } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/services/supabase/client';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteProfile = 'cycling-regular' | 'driving-car' | 'foot-walking';

export type RoutePreview = {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

type RoutePreviewPayload = {
  distanceMeters?: unknown;
  durationSeconds?: unknown;
  geometry?: {
    coordinates?: unknown;
    type?: unknown;
  };
};

export async function getRoutePreview({
  destination,
  origin,
  profile,
}: {
  destination: RouteCoordinate;
  origin: RouteCoordinate;
  profile: RouteProfile;
}): Promise<RoutePreview> {
  const { data, error } = await getSupabaseClient().functions.invoke<RoutePreviewPayload>(
    'route-preview',
    {
      body: { destination, origin, profile },
    },
  );

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = (await error.context.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new Error(payload?.error?.message || 'No pudimos calcular la ruta.');
    }
    throw new Error('No pudimos contactar el servicio de rutas.');
  }

  if (
    !data ||
    typeof data.distanceMeters !== 'number' ||
    typeof data.durationSeconds !== 'number' ||
    data.geometry?.type !== 'LineString' ||
    !Array.isArray(data.geometry.coordinates)
  ) {
    throw new Error('El servicio devolvió una ruta incompleta.');
  }

  const coordinates = data.geometry.coordinates.flatMap<RouteCoordinate>((coordinate) => {
    if (
      !Array.isArray(coordinate) ||
      coordinate.length < 2 ||
      typeof coordinate[0] !== 'number' ||
      typeof coordinate[1] !== 'number'
    ) {
      return [];
    }
    return [{ latitude: coordinate[1], longitude: coordinate[0] }];
  });

  if (coordinates.length < 2) throw new Error('La ruta no contiene suficientes puntos.');

  return {
    coordinates,
    distanceMeters: data.distanceMeters,
    durationSeconds: data.durationSeconds,
  };
}
