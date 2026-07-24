import { mapDatabaseError } from '../_shared/admin.ts';
import { errorResponse, jsonResponse, methodNotAllowed, optionsResponse } from '../_shared/http.ts';
import { createAdminClient, requireAdmin } from '../_shared/supabase.ts';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const QUERY_LIMIT = 1000;

type StatusRow = {
  created_at: string;
  status: 'archived' | 'pending' | 'published' | 'rejected';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse();
  if (request.method !== 'GET') return methodNotAllowed(['GET']);

  try {
    await requireAdmin(request);
    const client = createAdminClient();
    const [
      categoriesResult,
      placesResult,
      profilesResult,
      reviewsResult,
      suggestionsResult,
      reportsResult,
      imagesResult,
      favoritesResult,
      votesResult,
      auditResult,
    ] = await Promise.all([
      client
        .from('categories')
        .select('id, color, category_translations(locale, name)')
        .eq('is_active', true)
        .order('sort_order'),
      client
        .from('places')
        .select('id, category_id, status, created_at, place_translations(locale, name)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('profiles')
        .select('id, display_name, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('reviews')
        .select('id, rating, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('place_suggestions')
        .select('id, name, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('reports')
        .select('id, reason, target_type, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('place_images')
        .select('id, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('favorites')
        .select('place_id, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('tourist_votes')
        .select('is_touristic, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(QUERY_LIMIT),
      client
        .from('admin_audit_logs')
        .select('id, action, target_type, target_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    for (const result of [
      categoriesResult,
      placesResult,
      profilesResult,
      reviewsResult,
      suggestionsResult,
      reportsResult,
      imagesResult,
      favoritesResult,
      votesResult,
      auditResult,
    ]) {
      mapDatabaseError(result.error);
    }

    const generatedAt = new Date().toISOString();
    const since = Date.now() - THIRTY_DAYS_MS;
    const isRecent = (value: string) => new Date(value).getTime() >= since;
    const categories = (categoriesResult.data ?? []) as {
      category_translations: { locale: string; name: string }[];
      color: string;
      id: number;
    }[];
    const places = (placesResult.data ?? []) as (StatusRow & {
      category_id: number;
      id: string;
      place_translations: { locale: string; name: string }[];
    })[];
    const profiles = (profilesResult.data ?? []) as {
      created_at: string;
      display_name: string;
      id: string;
    }[];
    const reviews = (reviewsResult.data ?? []) as (StatusRow & {
      id: string;
      rating: number;
    })[];
    const suggestions = (suggestionsResult.data ?? []) as (StatusRow & {
      id: string;
      name: string;
    })[];
    const reports = (reportsResult.data ?? []) as {
      created_at: string;
      id: string;
      reason: string;
      status: 'dismissed' | 'open' | 'resolved';
      target_type: 'image' | 'place' | 'review';
    }[];
    const images = (imagesResult.data ?? []) as StatusRow[];
    const favorites = (favoritesResult.data ?? []) as { created_at: string }[];
    const votes = (votesResult.data ?? []) as {
      created_at: string;
      is_touristic: boolean;
    }[];
    const auditEntries = (auditResult.data ?? []) as {
      action: string;
      created_at: string;
      id: number;
      target_id: string;
      target_type: string;
    }[];

    const publishedReviews = reviews.filter((review) => review.status === 'published');
    const averageRating =
      publishedReviews.length === 0
        ? 0
        : publishedReviews.reduce((sum, review) => sum + review.rating, 0) /
          publishedReviews.length;
    const touristicYes = votes.filter((vote) => vote.is_touristic).length;
    const categoryById = new Map(
      categories.map((category) => [
        category.id,
        {
          color: category.color,
          name:
            category.category_translations.find((translation) => translation.locale === 'es')
              ?.name ??
            category.category_translations[0]?.name ??
            'Sin categoría',
        },
      ]),
    );
    const categoryCounts = new Map<number, number>();
    places
      .filter((place) => place.status === 'published')
      .forEach((place) =>
        categoryCounts.set(place.category_id, (categoryCounts.get(place.category_id) ?? 0) + 1),
      );
    const categoryBreakdown = [...categoryById.entries()]
      .map(([id, category]) => ({
        color: category.color,
        count: categoryCounts.get(id) ?? 0,
        id,
        name: category.name,
      }))
      .filter((category) => category.count > 0)
      .sort((left, right) => right.count - left.count);

    const placeName = (place: (typeof places)[number]) =>
      place.place_translations.find((translation) => translation.locale === 'es')?.name ??
      place.place_translations[0]?.name ??
      'Lugar sin nombre';
    const contentActivity = [
      ...places.slice(0, 5).map((place) => ({
        at: place.created_at,
        detail: placeName(place),
        id: `place-${place.id}`,
        label: place.status === 'published' ? 'Lugar publicado' : 'Lugar creado',
        tone: 'catalog' as const,
      })),
      ...profiles.slice(0, 5).map((profile) => ({
        at: profile.created_at,
        detail: profile.display_name,
        id: `profile-${profile.id}`,
        label: 'Nuevo usuario',
        tone: 'community' as const,
      })),
      ...reviews.slice(0, 5).map((review) => ({
        at: review.created_at,
        detail: `${review.rating}/5 estrellas`,
        id: `review-${review.id}`,
        label: 'Nueva reseña',
        tone: 'community' as const,
      })),
      ...suggestions.slice(0, 5).map((suggestion) => ({
        at: suggestion.created_at,
        detail: suggestion.name,
        id: `suggestion-${suggestion.id}`,
        label: 'Nueva sugerencia',
        tone: 'moderation' as const,
      })),
      ...reports.slice(0, 5).map((report) => ({
        at: report.created_at,
        detail: reportReasonLabel(report.reason),
        id: `report-${report.id}`,
        label: 'Nuevo reporte',
        tone: 'alert' as const,
      })),
      ...auditEntries.slice(0, 8).map((entry) => ({
        at: entry.created_at,
        detail: `${entry.target_type} #${entry.target_id.slice(0, 8)}`,
        id: `audit-${entry.id}`,
        label: auditActionLabel(entry.action),
        tone: 'admin' as const,
      })),
    ]
      .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, 10);

    return jsonResponse({
      categoryBreakdown,
      catalogStatus: statusCounts(places),
      generatedAt,
      growth30d: {
        favorites: favorites.filter((favorite) => isRecent(favorite.created_at)).length,
        newPlaces: places.filter((place) => isRecent(place.created_at)).length,
        newUsers: profiles.filter((profile) => isRecent(profile.created_at)).length,
        reports: reports.filter((report) => isRecent(report.created_at)).length,
        reviews: reviews.filter((review) => isRecent(review.created_at)).length,
        suggestions: suggestions.filter((suggestion) => isRecent(suggestion.created_at)).length,
      },
      metrics: {
        averageRating: Number(averageRating.toFixed(2)),
        favorites: favoritesResult.count ?? favorites.length,
        publishedPlaces: places.filter((place) => place.status === 'published').length,
        publishedReviews: publishedReviews.length,
        registeredUsers: profilesResult.count ?? profiles.length,
        touristicPercentage:
          votes.length === 0 ? 0 : Math.round((touristicYes / votes.length) * 100),
        touristVotes: votesResult.count ?? votes.length,
      },
      pending: {
        images: images.filter((image) => image.status === 'pending').length,
        places: places.filter((place) => place.status === 'pending').length,
        reports: reports.filter((report) => report.status === 'open').length,
        suggestions: suggestions.filter((suggestion) => suggestion.status === 'pending').length,
      },
      ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({
        count: publishedReviews.filter((review) => review.rating === rating).length,
        rating,
      })),
      recentActivity: contentActivity,
      suggestionStatus: statusCounts(suggestions),
    });
  } catch (error) {
    return errorResponse(error);
  }
});

function statusCounts(rows: StatusRow[]) {
  return (['published', 'pending', 'rejected', 'archived'] as const).map((status) => ({
    count: rows.filter((row) => row.status === status).length,
    status,
  }));
}

function reportReasonLabel(reason: string) {
  return (
    (
      {
        duplicate: 'Contenido duplicado',
        inappropriate: 'Contenido inapropiado',
        incorrect_information: 'Información incorrecta',
        other: 'Otro motivo',
        spam: 'Spam',
      } as Record<string, string>
    )[reason] ?? reason.replaceAll('_', ' ')
  );
}

function auditActionLabel(action: string) {
  return (
    (
      {
        'content.archive': 'Contenido archivado',
        'content.publish': 'Contenido publicado',
        'content.reject': 'Contenido rechazado',
        'report.dismissed': 'Reporte descartado',
        'report.resolved': 'Reporte resuelto',
        'suggestion.approve': 'Sugerencia aprobada',
        'suggestion.reject': 'Sugerencia rechazada',
      } as Record<string, string>
    )[action] ?? 'Acción administrativa'
  );
}
