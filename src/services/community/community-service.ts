import { getSupabaseClient } from '@/services/supabase/client';
import type { CatalogLocale, TourismPlace } from '@/services/catalog/place-service';

export type UserReview = {
  comment: string;
  id: string;
  rating: number;
  status: 'published' | 'archived' | 'pending' | 'rejected';
};

export type UserSuggestion = {
  createdAt: string;
  id: string;
  name: string;
  reviewNotes: string | null;
  status: 'pending' | 'published' | 'rejected' | 'archived';
};

type FavoritePlaceRow = {
  address: string;
  categories:
    { color: string; id: number; slug: string } | { color: string; id: number; slug: string }[];
  id: string;
  is_featured: boolean;
  place_translations: { name: string; short_description: string }[];
};

export async function getUserInterests(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('user_interests')
    .select('category_id, weight')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as { category_id: number; weight: number }[];
}

export async function replaceUserInterests(userId: string, categoryIds: number[]) {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (categoryIds.length === 0) return;

  const { error } = await supabase
    .from('user_interests')
    .insert(
      categoryIds.map((categoryId) => ({ category_id: categoryId, user_id: userId, weight: 1 })),
    );
  if (error) throw error;
}

export async function getFavoritePlaceIds(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('favorites')
    .select('place_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.place_id as string);
}

export async function getFavoritePlaces(userId: string, locale: CatalogLocale = 'es') {
  const favoriteIds = await getFavoritePlaceIds(userId);
  if (favoriteIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from('places')
    .select(
      'id, address, is_featured, place_translations!inner(locale, name, short_description), categories!inner(id, slug, color)',
    )
    .in('id', favoriteIds)
    .eq('status', 'published')
    .eq('place_translations.locale', locale);
  if (error) throw error;

  return ((data ?? []) as FavoritePlaceRow[]).map((row): TourismPlace => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    const translation = row.place_translations[0];
    return {
      address: row.address,
      categoryColor: category?.color ?? '#2FA7B0',
      categoryId: category?.id,
      categorySlug: category?.slug ?? 'actividades',
      id: row.id,
      isFeatured: row.is_featured,
      name: translation?.name ?? 'Lugar turístico',
      shortDescription: translation?.short_description ?? row.address,
    };
  });
}

export async function setFavorite(userId: string, placeId: string, favorite: boolean) {
  const query = getSupabaseClient().from('favorites');
  const { error } = favorite
    ? await query.insert({ place_id: placeId, user_id: userId })
    : await query.delete().eq('place_id', placeId).eq('user_id', userId);
  if (error && error.code !== '23505') throw error;
}

export async function getOwnReview(userId: string, placeId: string) {
  const { data, error } = await getSupabaseClient()
    .from('reviews')
    .select('id, rating, comment, status')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .maybeSingle();
  if (error) throw error;
  return data as UserReview | null;
}

export async function saveReview(
  userId: string,
  placeId: string,
  input: { comment: string; rating: number },
) {
  const { data, error } = await getSupabaseClient()
    .from('reviews')
    .upsert(
      {
        comment: input.comment.trim(),
        place_id: placeId,
        rating: input.rating,
        status: 'published',
        user_id: userId,
      },
      { onConflict: 'place_id,user_id' },
    )
    .select('id, rating, comment, status')
    .single();
  if (error) throw error;
  return data as UserReview;
}

export async function archiveReview(userId: string, placeId: string) {
  const { error } = await getSupabaseClient()
    .from('reviews')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('place_id', placeId);
  if (error) throw error;
}

export async function getOwnTouristVote(
  userId: string,
  placeId: string,
): Promise<boolean | null> {
  const { data, error } = await getSupabaseClient()
    .from('tourist_votes')
    .select('is_touristic')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_touristic ?? null;
}

export async function saveTouristVote(userId: string, placeId: string, isTouristic: boolean) {
  const { error } = await getSupabaseClient()
    .from('tourist_votes')
    .upsert(
      { is_touristic: isTouristic, place_id: placeId, user_id: userId },
      { onConflict: 'user_id,place_id' },
    );
  if (error) throw error;
}

export async function createPlaceSuggestion(
  userId: string,
  input: {
    address: string;
    categoryId: number;
    description: string;
    evidenceUrl?: string;
    latitude: number;
    longitude: number;
    name: string;
  },
) {
  const { data, error } = await getSupabaseClient()
    .from('place_suggestions')
    .insert({
      address: input.address.trim(),
      category_id: input.categoryId,
      description: input.description.trim(),
      evidence_url: input.evidenceUrl?.trim() || null,
      location: `POINT(${input.longitude} ${input.latitude})`,
      name: input.name.trim(),
      status: 'pending',
      submitted_by: userId,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getOwnSuggestions(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('place_suggestions')
    .select('id, name, status, review_notes, created_at')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map<UserSuggestion>((row) => ({
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    reviewNotes: row.review_notes,
    status: row.status,
  }));
}

export async function createReport(
  userId: string,
  input: {
    details?: string;
    reason: 'incorrect_information' | 'duplicate' | 'inappropriate' | 'spam' | 'other';
    targetId: string;
    targetType: 'place' | 'review' | 'image';
  },
) {
  const { error } = await getSupabaseClient()
    .from('reports')
    .insert({
      details: input.details?.trim() || null,
      reason: input.reason,
      reporter_id: userId,
      status: 'open',
      target_id: input.targetId,
      target_type: input.targetType,
    });
  if (error) throw error;
}
