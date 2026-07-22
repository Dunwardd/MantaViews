import { getSupabaseClient } from '@/services/supabase/client';
import { getSignedPlaceImageUrls } from '@/services/storage/image-service';

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
  id: string;
  name: string;
  status: ContentStatus;
};

export type AdminReport = {
  created_at: string;
  details: string | null;
  id: string;
  reason: string;
  status: 'dismissed' | 'open' | 'resolved';
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
    .select('id, name, description, address, status, created_at, categories(slug)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AdminSuggestion[];
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
  const { data, error } = await getSupabaseClient()
    .from('reports')
    .select('id, target_type, target_id, reason, details, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AdminReport[];
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
