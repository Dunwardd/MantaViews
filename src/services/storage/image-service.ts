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

type UploadImageInput = {
  bytes: ArrayBuffer;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  userId: string;
};

export async function uploadAvatar({ bytes, contentType, extension, userId }: UploadImageInput) {
  const path = `${userId}/avatar.${extension}`;
  const { error } = await getSupabaseClient().storage.from('avatars').upload(path, bytes, {
    cacheControl: '3600',
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function uploadPendingPlaceImage({
  altText,
  bytes,
  contentType,
  extension,
  placeId,
  reviewId = null,
  userId,
}: UploadImageInput & { altText: string; placeId: string; reviewId?: string | null }) {
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${placeId}/${uniqueName}.${extension}`;
  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage.from('place-images').upload(path, bytes, {
    cacheControl: '3600',
    contentType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('place_images')
    .insert({
      alt_text: altText.trim(),
      is_cover: false,
      place_id: placeId,
      review_id: reviewId,
      status: 'pending',
      storage_path: path,
      uploader_id: userId,
    })
    .select('id, status')
    .single();

  if (error) {
    await supabase.storage.from('place-images').remove([path]);
    throw error;
  }
  return data as { id: string; status: 'pending' };
}
