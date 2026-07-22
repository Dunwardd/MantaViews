import { routePreviewSchema } from '../_shared/api-schemas.ts';
import {
  ApiError,
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
  parseJson,
} from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';
import { requirePublishableKey } from '../_shared/supabase.ts';

const ROUTING_API_URL = 'https://valhalla1.openstreetmap.de/route';
const ROUTING_CLIENT_ID = 'MantaViews-academic';

const valhallaCostingByProfile = {
  'cycling-regular': 'bicycle',
  'driving-car': 'auto',
  'foot-walking': 'pedestrian',
} as const;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'POST') return methodNotAllowed(['POST']);

  try {
    requirePublishableKey(request);
    enforceRateLimit(request);
    const input = await parseJson(request, routePreviewSchema);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let response: Response;

    try {
      response = await fetch(ROUTING_API_URL, {
        body: JSON.stringify({
          costing: valhallaCostingByProfile[input.profile],
          locations: [
            { lat: input.origin.latitude, lon: input.origin.longitude },
            { lat: input.destination.latitude, lon: input.destination.longitude },
          ],
          shape_format: 'polyline6',
          units: 'kilometers',
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Client-Id': ROUTING_CLIENT_ID,
        },
        method: 'POST',
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(504, 'ROUTING_TIMEOUT', 'El proveedor de rutas tardó demasiado.');
      }
      throw new ApiError(502, 'ROUTING_UNAVAILABLE', 'No se pudo contactar al proveedor de rutas.');
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      throw new ApiError(429, 'ROUTING_RATE_LIMITED', 'El proveedor de rutas alcanzó su límite.');
    }
    if (!response.ok) {
      const providerMessage = (await response.text()).slice(0, 1_000);
      console.error(
        JSON.stringify({
          event: 'routing_provider_error',
          providerMessage,
          providerStatus: response.status,
        }),
      );
      throw new ApiError(502, 'ROUTING_PROVIDER_ERROR', 'El proveedor no pudo calcular la ruta.');
    }

    const payload = (await response.json()) as {
      trip?: {
        legs?: { shape?: unknown }[];
        status?: unknown;
        summary?: { length?: unknown; time?: unknown };
        units?: unknown;
      };
    };
    const legs = payload.trip?.legs;
    const summary = payload.trip?.summary;
    if (
      payload.trip?.status !== 0 ||
      payload.trip.units !== 'kilometers' ||
      !Array.isArray(legs) ||
      legs.length === 0 ||
      typeof summary?.length !== 'number' ||
      typeof summary.time !== 'number'
    ) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'El proveedor devolvió una respuesta incompleta.',
      );
    }

    const coordinates = legs.flatMap((leg, legIndex) => {
      if (typeof leg.shape !== 'string') {
        throw new ApiError(
          502,
          'INVALID_PROVIDER_RESPONSE',
          'El proveedor devolvió una geometría incompleta.',
        );
      }

      const decoded = decodePolyline6(leg.shape);
      return legIndex === 0 ? decoded : decoded.slice(1);
    });

    if (coordinates.length < 2) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'El proveedor devolvió una ruta sin suficientes puntos.',
      );
    }

    return jsonResponse({
      distanceMeters: Math.round(summary.length * 1_000),
      durationSeconds: Math.round(summary.time),
      geometry: { coordinates, type: 'LineString' },
    });
  } catch (error) {
    return errorResponse(error);
  }
});

function decodePolyline6(encoded: string) {
  const coordinates: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const latitudeResult = decodePolylineComponent(encoded, index);
    latitude += latitudeResult.delta;
    index = latitudeResult.nextIndex;

    const longitudeResult = decodePolylineComponent(encoded, index);
    longitude += longitudeResult.delta;
    index = longitudeResult.nextIndex;

    coordinates.push([longitude / 1_000_000, latitude / 1_000_000]);
  }

  return coordinates;
}

function decodePolylineComponent(encoded: string, startIndex: number) {
  let byte = 0;
  let index = startIndex;
  let result = 0;
  let shift = 0;

  do {
    if (index >= encoded.length || shift > 30) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'El proveedor devolvió una geometría inválida.',
      );
    }

    byte = encoded.charCodeAt(index) - 63;
    if (byte < 0) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'El proveedor devolvió una geometría inválida.',
      );
    }

    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    delta: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}
