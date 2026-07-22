import { ApiError } from './http.ts';

type RateBucket = { count: number; resetAt: number };
const buckets = new Map<string, RateBucket>();

export function enforceRateLimit(request: Request, limit = 30, windowMs = 60_000) {
  const clientId =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown';
  const now = Date.now();
  const current = buckets.get(clientId);

  if (!current || current.resetAt <= now) {
    buckets.set(clientId, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new ApiError(
      429,
      'RATE_LIMITED',
      'Demasiadas solicitudes. Inténtalo nuevamente en un minuto.',
    );
  }

  current.count += 1;
}
