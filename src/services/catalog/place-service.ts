import { getSupabaseClient } from '@/services/supabase/client';

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
  categoryColor: string;
  categoryId?: number;
  categorySlug: string;
  favoriteCount?: number;
  id: string;
  isFeatured: boolean;
  name: string;
  reviewCount?: number;
  shortDescription: string;
};

type SearchPlaceRow = {
  address: string;
  average_rating: number | string;
  category_id: number;
  category_slug: string;
  favorite_count: number | string;
  name: string;
  place_id: string;
  review_count: number | string;
  short_description: string;
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
}: SearchTourismPlacesParams = {}) {
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

  return (data as SearchPlaceRow[]).map<TourismPlace>((place) => ({
    address: place.address,
    averageRating: Number(place.average_rating ?? 0),
    categoryColor: '#2FA7B0',
    categoryId: place.category_id,
    categorySlug: place.category_slug,
    favoriteCount: Number(place.favorite_count ?? 0),
    id: place.place_id,
    isFeatured: false,
    name: place.name,
    reviewCount: Number(place.review_count ?? 0),
    shortDescription: place.short_description,
  }));
}

export async function getPlaceDetail(placeId: string, locale: CatalogLocale = 'es') {
  const { data, error } = await getSupabaseClient().rpc('get_place_detail', {
    p_locale: locale,
    p_place_id: placeId,
  });

  if (error) throw error;
  if (!data) return null;

  return data as PlaceDetail;
}
