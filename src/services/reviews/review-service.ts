import { getPublicAvatarUrl } from '@/services/storage/image-service';
import { getSupabaseClient } from '@/services/supabase/client';

type ReviewRow = {
  comment: string | null;
  created_at: string;
  id: string;
  rating: number;
  user_id: string;
};

type PublicProfileRow = {
  avatar_path: string | null;
  display_name: string;
  id: string;
};

export type PublicReview = {
  author: {
    avatarUrl: string | null;
    displayName: string;
  };
  comment: string | null;
  createdAt: string;
  id: string;
  rating: number;
};

export async function getPublishedReviews(placeId: string, limit = 10) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 30);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, rating, comment, created_at')
    .eq('place_id', placeId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  const reviews = (data ?? []) as ReviewRow[];
  const userIds = [...new Set(reviews.map((review) => review.user_id))];
  const profilesById = new Map<string, PublicProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('public_profiles')
      .select('id, display_name, avatar_path')
      .in('id', userIds);

    if (profilesError) throw profilesError;
    for (const profile of (profiles ?? []) as PublicProfileRow[]) {
      profilesById.set(profile.id, profile);
    }
  }

  return reviews.map<PublicReview>((review) => {
    const profile = profilesById.get(review.user_id);
    return {
      author: {
        avatarUrl: getPublicAvatarUrl(profile?.avatar_path ?? null),
        displayName: profile?.display_name ?? 'Visitante de MantaViews',
      },
      comment: review.comment,
      createdAt: review.created_at,
      id: review.id,
      rating: review.rating,
    };
  });
}
