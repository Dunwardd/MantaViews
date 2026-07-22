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

const ROUTING_API_URL = 'https://api.openrouteservice.org/v2/directions';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'POST') return methodNotAllowed(['POST']);

  try {
    requirePublishableKey(request);
    enforceRateLimit(request);
    const input = await parseJson(request, routePreviewSchema);
    const apiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!apiKey) {
      throw new ApiError(
        503,
        'ROUTING_NOT_CONFIGURED',
        'El proveedor de rutas todavía no está configurado.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let response: Response;

    try {
      response = await fetch(`${ROUTING_API_URL}/${input.profile}/geojson`, {
        body: JSON.stringify({
          coordinates: [
            [input.origin.longitude, input.origin.latitude],
            [input.destination.longitude, input.destination.latitude],
          ],
        }),
        headers: {
          Accept: 'application/json',
          Authorization: apiKey,
          'Content-Type': 'application/json',
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
      throw new ApiError(502, 'ROUTING_PROVIDER_ERROR', 'El proveedor no pudo calcular la ruta.');
    }

    const payload = (await response.json()) as {
      features?: {
        geometry?: unknown;
        properties?: { summary?: { distance?: number; duration?: number } };
      }[];
    };
    const feature = payload.features?.[0];
    const summary = feature?.properties?.summary;
    if (!feature?.geometry || summary?.distance === undefined || summary.duration === undefined) {
      throw new ApiError(
        502,
        'INVALID_PROVIDER_RESPONSE',
        'El proveedor devolvió una respuesta incompleta.',
      );
    }

    return jsonResponse({
      distanceMeters: Math.round(summary.distance),
      durationSeconds: Math.round(summary.duration),
      geometry: feature.geometry,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
