import { getSupabaseClient } from '@/services/supabase/client';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getSignedPlaceImageUrls(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return new Map<string, string>();

  const { data, error } = await getSupabaseClient()
    .storage.from('place-images')
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error) throw error;

  return new Map(
    (data ?? []).flatMap((item) =>
      item.signedUrl && item.path ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
}

export function getPublicAvatarUrl(path: string | null) {
  if (!path) return null;

  return getSupabaseClient().storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
