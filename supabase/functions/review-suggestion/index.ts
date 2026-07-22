import { reviewSuggestionSchema } from '../_shared/api-schemas.ts';
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
    const input = await parseJson(request, reviewSuggestionSchema);
    const client = createAdminClient();
    const { data: suggestion, error: suggestionError } = await client
      .from('place_suggestions')
      .select('*')
      .eq('id', input.suggestionId)
      .single();
    if (suggestionError?.code === 'PGRST116') {
      throw new ApiError(404, 'NOT_FOUND', 'Sugerencia no encontrada.');
    }
    mapDatabaseError(suggestionError);
    if (suggestion.status !== 'pending') {
      throw new ApiError(409, 'ALREADY_REVIEWED', 'La sugerencia ya fue revisada.');
    }

    let placeId: string | null = null;
    if (input.decision === 'approve') {
      const { data: place, error: placeError } = await client
        .from('places')
        .insert({
          address: suggestion.address,
          category_id: suggestion.category_id,
          created_by: suggestion.submitted_by,
          location: suggestion.location,
          status: 'pending',
        })
        .select('id')
        .single();
      mapDatabaseError(placeError);
      placeId = place.id;

      const shortDescription = suggestion.description.slice(0, 280);
      const translations = ['es', 'en'].map((locale) => ({
        description: suggestion.description,
        locale,
        name: suggestion.name,
        place_id: place.id,
        short_description: shortDescription,
      }));
      const { error: translationError } = await client
        .from('place_translations')
        .insert(translations);
      if (translationError) {
        await client.from('places').delete().eq('id', place.id);
        mapDatabaseError(translationError);
      }
    }

    const status = input.decision === 'approve' ? 'published' : 'rejected';
    const { data: reviewed, error: updateError } = await client
      .from('place_suggestions')
      .update({
        review_notes: input.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        status,
      })
      .eq('id', input.suggestionId)
      .select('*')
      .single();
    mapDatabaseError(updateError);
    await writeAuditLog(
      client,
      user.id,
      `suggestion.${input.decision}`,
      'suggestion',
      input.suggestionId,
      suggestion,
      { ...reviewed, created_place_id: placeId },
    );
    return jsonResponse({ createdPlaceId: placeId, suggestion: reviewed });
  } catch (error) {
    return errorResponse(error);
  }
});
