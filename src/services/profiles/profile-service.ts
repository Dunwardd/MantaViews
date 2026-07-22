import { getSupabaseClient } from '@/services/supabase/client';

export type CurrentProfile = {
  avatar_path: string | null;
  display_name: string;
  preferred_language: 'es' | 'en';
};

export async function getCurrentProfile(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('display_name, avatar_path, preferred_language')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as CurrentProfile;
}

export async function getCurrentUserIsAdmin() {
  const { data, error } = await getSupabaseClient().rpc('is_admin');
  if (error) throw error;
  return Boolean(data);
}

export async function updateCurrentProfile(
  userId: string,
  changes: Partial<Pick<CurrentProfile, 'avatar_path' | 'display_name' | 'preferred_language'>>,
) {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .select('display_name, avatar_path, preferred_language')
    .single();

  if (error) throw error;
  return data as CurrentProfile;
}
