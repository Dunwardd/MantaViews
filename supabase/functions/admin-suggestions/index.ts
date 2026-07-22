import { paginationSchema } from '../_shared/api-schemas.ts';
import { mapDatabaseError } from '../_shared/admin.ts';
import {
  ApiError,
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
} from '../_shared/http.ts';
import { createAdminClient, requireAdmin } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'GET') return methodNotAllowed(['GET']);

  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const pagination = paginationSchema.safeParse({
      limit: url.searchParams.get('limit') ?? 20,
      offset: url.searchParams.get('offset') ?? 0,
    });
    if (!pagination.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Paginación no válida.');
    const status = url.searchParams.get('status') ?? 'pending';
    if (!['archived', 'pending', 'published', 'rejected'].includes(status)) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Estado no válido.');
    }

    const { count, data, error } = await createAdminClient()
      .from('place_suggestions')
      .select('*, categories(slug)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(pagination.data.offset, pagination.data.offset + pagination.data.limit - 1);
    mapDatabaseError(error);
    return jsonResponse({ count: count ?? 0, items: data ?? [] });
  } catch (error) {
    return errorResponse(error);
  }
});
