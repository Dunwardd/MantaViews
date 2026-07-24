import { getSupabaseClient } from '@/services/supabase/client';
import { getSignedPlaceImageUrls } from '@/services/storage/image-service';
import { collectAllPagesById } from '@/services/catalog/pagination';
import { diversifyRecommendations } from '@/services/catalog/recommendation-algorithm';

export type CatalogLocale = 'es' | 'en';

type CategoryJoin = {
  color: string;
  slug: string;
};

type PlaceTranslationRow = {
  locale: CatalogLocale;
  name: string;
  short_description: string;
};

type PlaceRow = {
  address: string;
  categories: CategoryJoin | CategoryJoin[];
  id: string;
  is_featured: boolean;
  place_translations: PlaceTranslationRow[];
  published_at: string | null;
};

export type TourismPlace = {
  address: string;
  averageRating?: number;
  coverImagePath?: string | null;
  coverImageUrl?: string | null;
  distanceMeters?: number;
  categoryColor: string;
  categoryId?: number;
  categorySlug: string;
  favoriteCount?: number;
  id: string;
  isFeatured: boolean;
  latitude?: number;
  longitude?: number;
  name: string;
  reviewCount?: number;
  shortDescription: string;
};

type SearchPlaceRow = {
  address: string;
  average_rating: number | string;
  category_id: number;
  category_slug: string;
  cover_image_path: string | null;
  favorite_count: number | string;
  latitude: number | string;
  longitude: number | string;
  name: string;
  place_id: string;
  review_count: number | string;
  short_description: string;
};

type RecommendationRow = {
  average_rating: number | string;
  category_id: number;
  category_slug: string;
  cover_image_path: string | null;
  latitude: number | string;
  longitude: number | string;
  name: string;
  place_id: string;
  recommendation_reason: string;
  score: number | string;
  short_description: string;
};

export type TourismRecommendation = TourismPlace & {
  recommendationReason: string;
  score: number;
};

type NearbyPlaceRow = {
  address: string;
  average_rating: number | string;
  category_id: number;
  category_slug: string;
  cover_image_path: string | null;
  distance_meters: number | string;
  latitude: number | string;
  longitude: number | string;
  name: string;
  place_id: string;
  short_description: string;
};

export type NearbyTourismPlace = TourismPlace & {
  distanceMeters: number;
  latitude: number;
  longitude: number;
};

export type PlaceDetail = {
  address: string;
  category: {
    color: string;
    id: number;
    name: string;
    slug: string;
  };
  description: string;
  id: string;
  images: {
    altText: string | null;
    id: string;
    isCover: boolean;
    storagePath: string;
    url: string | null;
  }[];
  isFeatured: boolean;
  latitude: number;
  longitude: number;
  name: string;
  openingHours: Record<string, unknown>;
  phone: string | null;
  priceLevel: number | null;
  publishedAt: string | null;
  shortDescription: string;
  stats: {
    averageRating: number;
    favoriteCount: number;
    reviewCount: number;
    touristicNoCount: number;
    touristicPercentage: number;
    touristicYesCount: number;
  };
  websiteUrl: string | null;
};

export type SearchTourismPlacesParams = {
  categoryId?: number | null;
  limit?: number;
  locale?: CatalogLocale;
  offset?: number;
  query?: string;
};

export async function getPublishedPlaces(locale: CatalogLocale = 'es', limit = 8) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);
  const { data, error } = await getSupabaseClient()
    .from('places')
    .select(
      'id, address, is_featured, published_at, place_translations!inner(locale, name, short_description), categories!inner(slug, color)',
    )
    .eq('status', 'published')
    .eq('place_translations.locale', locale)
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  return (data as unknown as PlaceRow[]).map<TourismPlace>((place) => {
    const category = Array.isArray(place.categories) ? place.categories[0] : place.categories;
    const translation = place.place_translations[0];

    return {
      address: place.address,
      categoryColor: category?.color ?? '#2FA7B0',
      categorySlug: category?.slug ?? 'actividades',
      id: place.id,
      isFeatured: place.is_featured,
      name: translation?.name ?? 'Lugar turístico',
      shortDescription: translation?.short_description ?? place.address,
    };
  });
}

export async function searchTourismPlaces({
  categoryId = null,
  limit = 20,
  locale = 'es',
  offset = 0,
  query = '',
}: SearchTourismPlacesParams = {}): Promise<TourismPlace[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const safeOffset = Math.min(Math.max(Math.trunc(offset), 0), 10000);
  const safeQuery = query.trim().slice(0, 100);
  const { data, error } = await getSupabaseClient().rpc('search_places', {
    p_category_id: categoryId,
    p_limit: safeLimit,
    p_locale: locale,
    p_offset: safeOffset,
    p_query: safeQuery || null,
  });

  if (error) throw error;

  const rows = data as SearchPlaceRow[];
  const signedUrls = await getSignedPlaceImageUrls(
    rows.flatMap((place) => (place.cover_image_path ? [place.cover_image_path] : [])),
  );

  return rows.map<TourismPlace>((place) => ({
    address: place.address,
    averageRating: Number(place.average_rating ?? 0),
    categoryColor: '#2FA7B0',
    categoryId: place.category_id,
    categorySlug: place.category_slug,
    coverImagePath: place.cover_image_path,
    coverImageUrl: place.cover_image_path ? (signedUrls.get(place.cover_image_path) ?? null) : null,
    favoriteCount: Number(place.favorite_count ?? 0),
    id: place.place_id,
    isFeatured: false,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    name: place.name,
    reviewCount: Number(place.review_count ?? 0),
    shortDescription: place.short_description,
  }));
}

export function getAllTourismPlaces({
  categoryId = null,
  locale = 'es',
  query = '',
}: Pick<SearchTourismPlacesParams, 'categoryId' | 'locale' | 'query'> = {}) {
  const pageSize = 50;
  return collectAllPagesById({
    fetchPage: (offset, limit) =>
      searchTourismPlaces({ categoryId, limit, locale, offset, query }),
    pageSize,
  });
}

export async function getPlaceDetail(placeId: string, locale: CatalogLocale = 'es') {
  const { data, error } = await getSupabaseClient().rpc('get_place_detail', {
    p_locale: locale,
    p_place_id: placeId,
  });

  if (error) throw error;
  if (!data) return null;

  const place = data as PlaceDetail;
  const signedUrls = await getSignedPlaceImageUrls(place.images.map((image) => image.storagePath));

  return {
    ...place,
    images: place.images.map((image) => ({
      ...image,
      url: signedUrls.get(image.storagePath) ?? null,
    })),
  };
}

export async function getTourismRecommendations(
  locale: CatalogLocale = 'es',
  limit = 4,
  location?: { latitude: number; longitude: number } | null,
): Promise<TourismRecommendation[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 12);
  const { data, error } = await getSupabaseClient().rpc('get_recommendations', {
    p_latitude: location?.latitude ?? null,
    p_limit: safeLimit,
    p_locale: locale,
    p_longitude: location?.longitude ?? null,
  });

  if (error) throw error;

  const rows = data as RecommendationRow[];
  const signedUrls = await getSignedPlaceImageUrls(
    rows.flatMap((place) => (place.cover_image_path ? [place.cover_image_path] : [])),
  );

  const recommendations = rows.map<TourismRecommendation>((place) => ({
    address: '',
    averageRating: Number(place.average_rating ?? 0),
    categoryColor: '#2FA7B0',
    categoryId: place.category_id,
    categorySlug: place.category_slug,
    coverImagePath: place.cover_image_path,
    coverImageUrl: place.cover_image_path ? (signedUrls.get(place.cover_image_path) ?? null) : null,
    id: place.place_id,
    isFeatured: true,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    name: place.name,
    recommendationReason: place.recommendation_reason,
    score: Number(place.score ?? 0),
    shortDescription: place.short_description,
  }));

  return diversifyRecommendations(recommendations, safeLimit);
}

export async function getNearbyTourismPlaces({
  categoryId = null,
  latitude,
  limit = 20,
  locale = 'es',
  longitude,
  radiusMeters = 15_000,
}: {
  categoryId?: number | null;
  latitude: number;
  limit?: number;
  locale?: CatalogLocale;
  longitude: number;
  radiusMeters?: number;
}): Promise<NearbyTourismPlace[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const safeRadius = Math.min(Math.max(Math.trunc(radiusMeters), 100), 50_000);
  const { data, error } = await getSupabaseClient().rpc('nearby_places', {
    p_category_id: categoryId,
    p_latitude: latitude,
    p_limit: safeLimit,
    p_locale: locale,
    p_longitude: longitude,
    p_radius_meters: safeRadius,
  });

  if (error) throw error;

  const rows = data as NearbyPlaceRow[];
  const signedUrls = await getSignedPlaceImageUrls(
    rows.flatMap((place) => (place.cover_image_path ? [place.cover_image_path] : [])),
  );

  return rows.map<NearbyTourismPlace>((place) => ({
    address: place.address,
    averageRating: Number(place.average_rating ?? 0),
    categoryColor: '#2FA7B0',
    categoryId: place.category_id,
    categorySlug: place.category_slug,
    coverImagePath: place.cover_image_path,
    coverImageUrl: place.cover_image_path ? (signedUrls.get(place.cover_image_path) ?? null) : null,
    distanceMeters: Number(place.distance_meters),
    id: place.place_id,
    isFeatured: false,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    name: place.name,
    shortDescription: place.short_description,
  }));
}
