import { resolveReportSchema } from '../_shared/api-schemas.ts';
import { mapDatabaseError, writeAuditLog } from '../_shared/admin.ts';
import {
  ApiError,
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  optionsResponse,
  parseJson,
} from '../_shared/http.ts';
import { createAdminClient, requireAdmin } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'POST') return methodNotAllowed(['POST']);

  try {
    const { user } = await requireAdmin(request);
    const input = await parseJson(request, resolveReportSchema);
    const client = createAdminClient();
    const { data: report, error: reportError } = await client
      .from('reports')
      .select('*')
      .eq('id', input.reportId)
      .single();
    if (reportError?.code === 'PGRST116')
      throw new ApiError(404, 'NOT_FOUND', 'Reporte no encontrado.');
    mapDatabaseError(reportError);
    if (report.status !== 'open')
      throw new ApiError(409, 'ALREADY_RESOLVED', 'El reporte ya fue resuelto.');

    if (input.moderationAction === 'archive_target') {
      const targetTables = { image: 'place_images', place: 'places', review: 'reviews' } as const;
      const targetTable = targetTables[report.target_type as keyof typeof targetTables];
      if (!targetTable)
        throw new ApiError(422, 'INVALID_TARGET', 'El tipo de contenido no es válido.');
      const { error } = await client
        .from(targetTable)
        .update({ status: 'archived' })
        .eq('id', report.target_id);
      mapDatabaseError(error);
    }

    const { data: resolved, error } = await client
      .from('reports')
      .update({
        resolved_at: new Date().toISOString(),
        reviewed_by: user.id,
        status: input.resolution,
      })
      .eq('id', input.reportId)
      .select('*')
      .single();
    mapDatabaseError(error);
    await writeAuditLog(
      client,
      user.id,
      `report.${input.resolution}`,
      'report',
      input.reportId,
      report,
      { ...resolved, moderation_action: input.moderationAction },
    );
    return jsonResponse(resolved);
  } catch (error) {
    return errorResponse(error);
  }
});
