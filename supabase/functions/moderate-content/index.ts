import { moderateContentSchema } from '../_shared/api-schemas.ts';
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
    const input = await parseJson(request, moderateContentSchema);
    const client = createAdminClient();
    const table = input.targetType === 'review' ? 'reviews' : 'place_images';
    const { data: before, error: beforeError } = await client
      .from(table)
      .select('*')
      .eq('id', input.targetId)
      .single();
    if (beforeError?.code === 'PGRST116')
      throw new ApiError(404, 'NOT_FOUND', 'Contenido no encontrado.');
    mapDatabaseError(beforeError);

    const status =
      input.decision === 'publish'
        ? 'published'
        : input.decision === 'reject'
          ? 'rejected'
          : 'archived';
    const update: { is_cover?: boolean; status: string } = { status };

    if (input.targetType === 'image') {
      if (input.decision === 'publish') {
        const { data: currentCover, error: coverError } = await client
          .from('place_images')
          .select('id')
          .eq('place_id', before.place_id)
          .eq('status', 'published')
          .eq('is_cover', true)
          .neq('id', input.targetId)
          .limit(1)
          .maybeSingle();
        mapDatabaseError(coverError);
        update.is_cover = currentCover === null;
      } else if (before.is_cover) {
        update.is_cover = false;
      }
    }

    const { data: after, error } = await client
      .from(table)
      .update(update)
      .eq('id', input.targetId)
      .select('*')
      .single();
    mapDatabaseError(error);

    if (input.targetType === 'image' && input.decision !== 'publish' && before.is_cover) {
      const { data: replacement, error: replacementError } = await client
        .from('place_images')
        .select('id')
        .eq('place_id', before.place_id)
        .eq('status', 'published')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      mapDatabaseError(replacementError);

      if (replacement) {
        const { error: promoteError } = await client
          .from('place_images')
          .update({ is_cover: true })
          .eq('id', replacement.id);
        mapDatabaseError(promoteError);
      }
    }

    await writeAuditLog(
      client,
      user.id,
      `${input.targetType}.${input.decision}`,
      input.targetType,
      input.targetId,
      before,
      { ...after, moderation_notes: input.notes ?? null },
    );
    return jsonResponse(after);
  } catch (error) {
    return errorResponse(error);
  }
});
