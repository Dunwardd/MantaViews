import { getSupabaseClient } from '@/services/supabase/client';
import { getPublicAvatarUrl, getSignedPlaceImageUrls } from '@/services/storage/image-service';

export type ContentStatus = 'archived' | 'pending' | 'published' | 'rejected';

export type AdminPlaceTranslation = {
  description: string;
  locale: 'en' | 'es';
  name: string;
  short_description: string;
};

export type AdminPlace = {
  address: string;
  category_id: number;
  created_at: string;
  id: string;
  is_featured: boolean;
  location: unknown;
  phone: string | null;
  place_translations: AdminPlaceTranslation[];
  price_level: number | null;
  status: ContentStatus;
  website_url: string | null;
};

export type AdminSuggestion = {
  address: string;
  categories: { slug: string } | { slug: string }[] | null;
  created_at: string;
  description: string;
  description_en: string | null;
  id: string;
  image_storage_path: string | null;
  image_url: string | null;
  name: string;
  name_en: string | null;
  status: ContentStatus;
};

export type AdminReportTarget = {
  address: string | null;
  authorName: string | null;
  body: string | null;
  createdAt: string | null;
  imageUrl: string | null;
  placeId: string | null;
  placeName: string | null;
  rating: number | null;
  status: ContentStatus | null;
  title: string;
};

export type AdminReport = {
  created_at: string;
  details: string | null;
  id: string;
  reason: string;
  reporterAvatarUrl: string | null;
  reporterId: string;
  reporterName: string;
  status: 'dismissed' | 'open' | 'resolved';
  target: AdminReportTarget;
  target_id: string;
  target_type: 'image' | 'place' | 'review';
};

export type ModerationItem = {
  comment?: string;
  created_at: string;
  id: string;
  image_url?: string | null;
  place_id: string;
  rating?: number;
  status: ContentStatus;
  storage_path?: string;
  type: 'image' | 'review';
};

export type AdminPlaceInput = {
  address: string;
  categoryId: number;
  isFeatured: boolean;
  latitude: number;
  longitude: number;
  openingHours: Record<string, unknown>;
  phone: string | null;
  priceLevel: number | null;
  status: 'archived' | 'pending' | 'published';
  translations: {
    en: { description: string; name: string; shortDescription: string };
    es: { description: string; name: string; shortDescription: string };
  };
  websiteUrl: string | null;
};

export async function getAdminSummary() {
  const client = getSupabaseClient();
  const queries = [
    client.from('places').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client
      .from('place_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('place_images')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ] as const;
  const results = await Promise.all(queries);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  return {
    images: results[2].count ?? 0,
    places: results[0].count ?? 0,
    reports: results[3].count ?? 0,
    suggestions: results[1].count ?? 0,
  };
}

export async function getAdminPlaces() {
  const { data, error } = await getSupabaseClient()
    .from('places')
    .select(
      'id, address, category_id, created_at, is_featured, location, phone, price_level, status, website_url, place_translations(locale, name, short_description, description)',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AdminPlace[];
}

export async function getPendingSuggestions() {
  const { data, error } = await getSupabaseClient()
    .from('place_suggestions')
    .select(
      'id, name, name_en, description, description_en, address, status, created_at, image_storage_path, categories(slug)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const signedUrls = await getSignedPlaceImageUrls(
    (data ?? []).flatMap((item) => (item.image_storage_path ? [item.image_storage_path] : [])),
  );
  return (data ?? []).map(
    (item) =>
      ({
        ...item,
        image_url: item.image_storage_path
          ? (signedUrls.get(item.image_storage_path) ?? null)
          : null,
      }) as AdminSuggestion,
  );
}

export async function getModerationItems() {
  const client = getSupabaseClient();
  const [images, reviews] = await Promise.all([
    client
      .from('place_images')
      .select('id, place_id, storage_path, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30),
    client
      .from('reviews')
      .select('id, place_id, rating, comment, status, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);
  if (images.error) throw images.error;
  if (reviews.error) throw reviews.error;
  const signedUrls = await getSignedPlaceImageUrls(
    (images.data ?? []).map((item) => item.storage_path),
  );
  return [
    ...(images.data ?? []).map((item) => ({
      ...item,
      image_url: signedUrls.get(item.storage_path) ?? null,
      type: 'image' as const,
    })),
    ...(reviews.data ?? []).map((item) => ({ ...item, type: 'review' as const })),
  ] as ModerationItem[];
}

export async function getOpenReports() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, details, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!data?.length) return [];

  const reportRows = data as {
    created_at: string;
    details: string | null;
    id: string;
    reason: string;
    reporter_id: string;
    status: 'dismissed' | 'open' | 'resolved';
    target_id: string;
    target_type: 'image' | 'place' | 'review';
  }[];
  const reviewIds = reportRows
    .filter((report) => report.target_type === 'review')
    .map((report) => report.target_id);
  const imageIds = reportRows
    .filter((report) => report.target_type === 'image')
    .map((report) => report.target_id);
  const emptyResult = { data: [], error: null } as const;
  const [reviewsResult, imagesResult] = await Promise.all([
    reviewIds.length
      ? client
          .from('reviews')
          .select('id, place_id, user_id, rating, comment, status, created_at')
          .in('id', reviewIds)
      : Promise.resolve(emptyResult),
    imageIds.length
      ? client
          .from('place_images')
          .select('id, place_id, uploader_id, storage_path, alt_text, status, created_at')
          .in('id', imageIds)
      : Promise.resolve(emptyResult),
  ]);
  if (reviewsResult.error) throw reviewsResult.error;
  if (imagesResult.error) throw imagesResult.error;

  const reviews = reviewsResult.data as {
    comment: string;
    created_at: string;
    id: string;
    place_id: string;
    rating: number;
    status: ContentStatus;
    user_id: string;
  }[];
  const images = imagesResult.data as {
    alt_text: string;
    created_at: string;
    id: string;
    place_id: string;
    status: ContentStatus;
    storage_path: string;
    uploader_id: string | null;
  }[];
  const profileIds = [
    ...new Set([
      ...reportRows.map((report) => report.reporter_id),
      ...reviews.map((review) => review.user_id),
      ...images.flatMap((image) => (image.uploader_id ? [image.uploader_id] : [])),
    ]),
  ];
  const placeIds = [
    ...new Set([
      ...reportRows
        .filter((report) => report.target_type === 'place')
        .map((report) => report.target_id),
      ...reviews.map((review) => review.place_id),
      ...images.map((image) => image.place_id),
    ]),
  ];
  const [profilesResult, placesResult, coversResult] = await Promise.all([
    profileIds.length
      ? client.from('profiles').select('id, display_name, avatar_path').in('id', profileIds)
      : Promise.resolve(emptyResult),
    placeIds.length
      ? client
          .from('places')
          .select('id, address, status, created_at, place_translations(locale, name, description)')
          .in('id', placeIds)
      : Promise.resolve(emptyResult),
    placeIds.length
      ? client
          .from('place_images')
          .select('place_id, storage_path, created_at')
          .in('place_id', placeIds)
          .eq('is_cover', true)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : Promise.resolve(emptyResult),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (placesResult.error) throw placesResult.error;
  if (coversResult.error) throw coversResult.error;

  const profiles = profilesResult.data as {
    avatar_path: string | null;
    display_name: string;
    id: string;
  }[];
  const places = placesResult.data as {
    address: string;
    created_at: string;
    id: string;
    place_translations: { description: string; locale: string; name: string }[];
    status: ContentStatus;
  }[];
  const covers = coversResult.data as {
    created_at: string;
    place_id: string;
    storage_path: string;
  }[];
  const signedUrls = await getSignedPlaceImageUrls([
    ...images.map((image) => image.storage_path),
    ...covers.map((cover) => cover.storage_path),
  ]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const reviewById = new Map(reviews.map((review) => [review.id, review]));
  const imageById = new Map(images.map((image) => [image.id, image]));
  const placeById = new Map(places.map((place) => [place.id, place]));
  const coverByPlaceId = new Map<string, string>();
  covers.forEach((cover) => {
    if (!coverByPlaceId.has(cover.place_id)) {
      coverByPlaceId.set(cover.place_id, cover.storage_path);
    }
  });

  const getPlaceName = (placeId: string) => {
    const translations = placeById.get(placeId)?.place_translations ?? [];
    return (
      translations.find((translation) => translation.locale === 'es')?.name ??
      translations.find((translation) => translation.locale === 'en')?.name ??
      null
    );
  };
  const getPlaceImageUrl = (placeId: string) => {
    const path = coverByPlaceId.get(placeId);
    return path ? (signedUrls.get(path) ?? null) : null;
  };

  return reportRows.map<AdminReport>((report) => {
    const reporter = profileById.get(report.reporter_id);
    let target: AdminReportTarget;

    if (report.target_type === 'place') {
      const place = placeById.get(report.target_id);
      const translation =
        place?.place_translations.find((item) => item.locale === 'es') ??
        place?.place_translations.find((item) => item.locale === 'en');
      target = {
        address: place?.address ?? null,
        authorName: null,
        body: translation?.description ?? null,
        createdAt: place?.created_at ?? null,
        imageUrl: getPlaceImageUrl(report.target_id),
        placeId: place?.id ?? null,
        placeName: translation?.name ?? null,
        rating: null,
        status: place?.status ?? null,
        title: translation?.name ?? 'Lugar no disponible',
      };
    } else if (report.target_type === 'review') {
      const review = reviewById.get(report.target_id);
      const author = review ? profileById.get(review.user_id) : null;
      target = {
        address: null,
        authorName: author?.display_name ?? null,
        body: review?.comment ?? null,
        createdAt: review?.created_at ?? null,
        imageUrl: review ? getPlaceImageUrl(review.place_id) : null,
        placeId: review?.place_id ?? null,
        placeName: review ? getPlaceName(review.place_id) : null,
        rating: review?.rating ?? null,
        status: review?.status ?? null,
        title: author ? `Reseña de ${author.display_name}` : 'Reseña no disponible',
      };
    } else {
      const image = imageById.get(report.target_id);
      const author = image?.uploader_id ? profileById.get(image.uploader_id) : null;
      target = {
        address: null,
        authorName: author?.display_name ?? null,
        body: image?.alt_text ?? null,
        createdAt: image?.created_at ?? null,
        imageUrl: image ? (signedUrls.get(image.storage_path) ?? null) : null,
        placeId: image?.place_id ?? null,
        placeName: image ? getPlaceName(image.place_id) : null,
        rating: null,
        status: image?.status ?? null,
        title: image?.alt_text ?? 'Fotografía no disponible',
      };
    }

    return {
      created_at: report.created_at,
      details: report.details,
      id: report.id,
      reason: report.reason,
      reporterAvatarUrl: getPublicAvatarUrl(reporter?.avatar_path ?? null),
      reporterId: report.reporter_id,
      reporterName: reporter?.display_name ?? 'Usuario no disponible',
      status: report.status,
      target,
      target_id: report.target_id,
      target_type: report.target_type,
    };
  });
}

async function invokeAdmin<T>(
  functionName: string,
  options: {
    body?: Partial<AdminPlaceInput> | Record<string, unknown>;
    method?: 'DELETE' | 'GET' | 'PATCH' | 'POST';
  } = {},
) {
  const { data, error } = await getSupabaseClient().functions.invoke(functionName, options);
  if (error) throw error;
  return data as T;
}

export function createAdminPlace(input: AdminPlaceInput) {
  return invokeAdmin<AdminPlace>('admin-places', { body: input, method: 'POST' });
}

export function updateAdminPlace(id: string, input: Partial<AdminPlaceInput>) {
  return invokeAdmin<AdminPlace>(`admin-places/${id}`, { body: input, method: 'PATCH' });
}

export function archiveAdminPlace(id: string) {
  return invokeAdmin<AdminPlace>(`admin-places/${id}`, { method: 'DELETE' });
}

export function reviewSuggestion(
  suggestionId: string,
  decision: 'approve' | 'reject',
  notes: string | null = null,
) {
  return invokeAdmin('review-suggestion', {
    body: { decision, notes, suggestionId },
    method: 'POST',
  });
}

export function moderateContent(
  targetType: 'image' | 'review',
  targetId: string,
  decision: 'archive' | 'publish' | 'reject',
  notes: string | null = null,
) {
  return invokeAdmin('moderate-content', {
    body: { decision, notes, targetId, targetType },
    method: 'POST',
  });
}

export function resolveReport(
  reportId: string,
  resolution: 'dismissed' | 'resolved',
  moderationAction: 'archive_target' | 'none',
) {
  return invokeAdmin('resolve-report', {
    body: { moderationAction, reportId, resolution },
    method: 'POST',
  });
}

export function parsePoint(location: unknown): { latitude: number; longitude: number } {
  if (
    typeof location === 'object' &&
    location !== null &&
    'coordinates' in location &&
    Array.isArray((location as { coordinates: unknown }).coordinates)
  ) {
    const [longitude, latitude] = (location as { coordinates: number[] }).coordinates;
    if (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    )
      return { latitude, longitude };
  }
  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/i);
    if (match) return { latitude: Number(match[2]), longitude: Number(match[1]) };
  }
  return { latitude: -0.9538, longitude: -80.7324 };
}
