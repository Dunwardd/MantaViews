import {
  adminPlaceSchema,
  adminPlaceUpdateSchema,
  paginationSchema,
  uuidSchema,
} from '../_shared/api-schemas.ts';
import { getPathId, mapDatabaseError, writeAuditLog } from '../_shared/admin.ts';
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
  if (!['DELETE', 'GET', 'PATCH', 'POST'].includes(request.method)) {
    return methodNotAllowed(['DELETE', 'GET', 'PATCH', 'POST']);
  }

  try {
    const { user } = await requireAdmin(request);
    const client = createAdminClient();
    const placeId = getPathId(request, 'admin-places');

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const parsedPagination = paginationSchema.safeParse({
        limit: url.searchParams.get('limit') ?? 20,
        offset: url.searchParams.get('offset') ?? 0,
      });
      if (!parsedPagination.success) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'La paginación no es válida.');
      }
      const status = url.searchParams.get('status');
      if (status && !['archived', 'pending', 'published', 'rejected'].includes(status)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'El estado no es válido.');
      }

      let query = client
        .from('places')
        .select('*, place_translations(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(
          parsedPagination.data.offset,
          parsedPagination.data.offset + parsedPagination.data.limit - 1,
        );
      if (status) query = query.eq('status', status);
      const { count, data, error } = await query;
      mapDatabaseError(error);
      return jsonResponse({ count: count ?? 0, items: data ?? [] });
    }

    if (request.method === 'POST') {
      const input = await parseJson(request, adminPlaceSchema);
      const { data: place, error: placeError } = await client
        .from('places')
        .insert({
          address: input.address,
          category_id: input.categoryId,
          created_by: user.id,
          is_featured: input.isFeatured,
          location: `POINT(${input.longitude} ${input.latitude})`,
          opening_hours: input.openingHours,
          phone: input.phone ?? null,
          price_level: input.priceLevel ?? null,
          status: input.status,
          website_url: input.websiteUrl ?? null,
        })
        .select('*')
        .single();
      mapDatabaseError(placeError);

      const translations = Object.entries(input.translations).map(([locale, translation]) => ({
        description: translation.description,
        locale,
        name: translation.name,
        place_id: place.id,
        short_description: translation.shortDescription,
      }));
      const { error: translationsError } = await client
        .from('place_translations')
        .insert(translations);
      if (translationsError) {
        await client.from('places').delete().eq('id', place.id);
        mapDatabaseError(translationsError);
      }

      const after = { ...place, place_translations: translations };
      await writeAuditLog(client, user.id, 'place.create', 'place', place.id, null, after);
      return jsonResponse(after, 201);
    }

    const parsedId = uuidSchema.safeParse(placeId);
    if (!parsedId.success) throw new ApiError(400, 'INVALID_ID', 'El identificador no es válido.');
    const { data: before, error: beforeError } = await client
      .from('places')
      .select('*, place_translations(*)')
      .eq('id', parsedId.data)
      .single();
    if (beforeError?.code === 'PGRST116')
      throw new ApiError(404, 'NOT_FOUND', 'Lugar no encontrado.');
    mapDatabaseError(beforeError);

    if (request.method === 'DELETE') {
      const { data: archived, error } = await client
        .from('places')
        .update({ status: 'archived' })
        .eq('id', parsedId.data)
        .select('*')
        .single();
      mapDatabaseError(error);
      await writeAuditLog(
        client,
        user.id,
        'place.archive',
        'place',
        parsedId.data,
        before,
        archived,
      );
      return jsonResponse(archived);
    }

    const input = await parseJson(request, adminPlaceUpdateSchema);
    const updates = {
      ...(input.address === undefined ? {} : { address: input.address }),
      ...(input.categoryId === undefined ? {} : { category_id: input.categoryId }),
      ...(input.isFeatured === undefined ? {} : { is_featured: input.isFeatured }),
      ...(input.latitude === undefined || input.longitude === undefined
        ? {}
        : { location: `POINT(${input.longitude} ${input.latitude})` }),
      ...(input.openingHours === undefined ? {} : { opening_hours: input.openingHours }),
      ...(input.phone === undefined ? {} : { phone: input.phone }),
      ...(input.priceLevel === undefined ? {} : { price_level: input.priceLevel }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.websiteUrl === undefined ? {} : { website_url: input.websiteUrl }),
    };

    if ((input.latitude === undefined) !== (input.longitude === undefined)) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Latitud y longitud deben enviarse juntas.');
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await client.from('places').update(updates).eq('id', parsedId.data);
      mapDatabaseError(error);
    }
    if (input.translations) {
      const translations = Object.entries(input.translations).map(([locale, translation]) => ({
        description: translation.description,
        locale,
        name: translation.name,
        place_id: parsedId.data,
        short_description: translation.shortDescription,
      }));
      const { error } = await client
        .from('place_translations')
        .upsert(translations, { onConflict: 'place_id,locale' });
      mapDatabaseError(error);
    }
    const { data: after, error: afterError } = await client
      .from('places')
      .select('*, place_translations(*)')
      .eq('id', parsedId.data)
      .single();
    mapDatabaseError(afterError);
    await writeAuditLog(client, user.id, 'place.update', 'place', parsedId.data, before, after);
    return jsonResponse(after);
  } catch (error) {
    return errorResponse(error);
  }
});
