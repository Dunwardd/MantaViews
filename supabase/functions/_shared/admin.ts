import type { SupabaseClient } from '@supabase/supabase-js';

import { ApiError } from './http.ts';

export async function writeAuditLog(
  client: SupabaseClient,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  beforeData: unknown,
  afterData: unknown,
) {
  const { error } = await client.from('admin_audit_logs').insert({
    action,
    admin_id: adminId,
    after_data: afterData,
    before_data: beforeData,
    target_id: targetId,
    target_type: targetType,
  });

  if (error)
    throw new ApiError(500, 'AUDIT_ERROR', 'No se pudo registrar la acción administrativa.');
}

export function getPathId(request: Request, functionName: string) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const functionIndex = segments.lastIndexOf(functionName);
  return functionIndex >= 0 ? segments[functionIndex + 1] : undefined;
}

export function mapDatabaseError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new ApiError(409, 'CONFLICT', 'El recurso ya existe.');
  if (error.code === '23503')
    throw new ApiError(422, 'INVALID_REFERENCE', 'Una referencia no existe.');
  if (error.code === '23514')
    throw new ApiError(422, 'CONSTRAINT_ERROR', 'Los datos incumplen una restricción.');
  throw new ApiError(500, 'DATABASE_ERROR', 'No se pudo completar la operación.');
}
