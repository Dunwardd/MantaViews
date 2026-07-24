import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AppAvatar } from '@/components/ui/app-avatar';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getCurrentProfile } from '@/services/profiles/profile-service';
import { getPublicAvatarUrl } from '@/services/storage/image-service';

export function ProfileHeaderButton() {
  const { user } = useAuth();
  const { t } = useLocale();
  const profileQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getCurrentProfile(user!.id),
    queryKey: ['private', 'profile', user?.id],
  });
  const label = profileQuery.data?.display_name ?? user?.email ?? t('tabs.profile');
  const metadataAvatar =
    typeof user?.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
  const avatarUri =
    getPublicAvatarUrl(profileQuery.data?.avatar_path ?? null) ?? metadataAvatar;

  return (
    <Pressable
      accessibilityLabel={t('profile.open')}
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => router.navigate('/(tabs)/profile')}
      style={({ pressed }) => ({
        alignItems: 'center',
        height: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
        width: 44,
      })}
    >
      <AppAvatar label={label} size={34} uri={avatarUri} />
    </Pressable>
  );
}
