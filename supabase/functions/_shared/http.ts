import type { ZodError, ZodType } from 'zod';

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'DELETE, GET, OPTIONS, PATCH, POST',
  'Access-Control-Allow-Origin': '*',
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function jsonResponse(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
    status,
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse(
      { error: { code: error.code, details: error.details ?? {}, message: error.message } },
      error.status,
    );
  }

  console.error(error instanceof Error ? error.message : 'Unknown Edge Function error');
  return jsonResponse(
    { error: { code: 'INTERNAL_ERROR', details: {}, message: 'Ocurrió un error interno.' } },
    500,
  );
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'El cuerpo debe ser JSON válido.');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(
      422,
      'VALIDATION_ERROR',
      'Los datos enviados no son válidos.',
      formatZodError(result.error),
    );
  }

  return result.data;
}

export function methodNotAllowed(allowed: string[]) {
  return jsonResponse(
    { error: { code: 'METHOD_NOT_ALLOWED', details: {}, message: 'Método no permitido.' } },
    405,
    { Allow: allowed.join(', ') },
  );
}

export function optionsResponse() {
  return new Response('ok', { headers: corsHeaders });
}

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({ message: issue.message, path: issue.path.join('.') }));
}
