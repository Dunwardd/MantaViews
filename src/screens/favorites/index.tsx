import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PlaceCard } from '@/components/places/place-card';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getFavoritePlaces } from '@/services/community/community-service';
import { brandColors, colors, layout, spacing } from '@/theme';

export function FavoritesScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { locale, t } = useLocale();
  const favoritesQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getFavoritePlaces(user!.id, locale),
    queryKey: ['private', 'favorites', user?.id, locale],
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.lg,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      {isLoading ? (
        <LoadingState label={t('favorites.checking')} />
      ) : isAuthenticated && favoritesQuery.isPending ? (
        <LoadingState label={t('favorites.loading')} />
      ) : isAuthenticated && favoritesQuery.isError ? (
        <FeedbackState
          actionLabel={t('common.retry')}
          description={t('favorites.unavailableDescription')}
          onAction={() => void favoritesQuery.refetch()}
          title={t('favorites.unavailableTitle')}
          tone="error"
        />
      ) : isAuthenticated && favoritesQuery.data?.length ? (
        <View style={{ gap: spacing.lg }}>
          {favoritesQuery.data.map((place) => (
            <PlaceCard
              categoryName={place.categorySlug.replaceAll('-', ' ')}
              key={place.id}
              place={place}
            />
          ))}
        </View>
      ) : isAuthenticated ? (
        <FeedbackState
          title={t('favorites.emptyTitle')}
          description={t('favorites.emptyDescription')}
        />
      ) : (
        <>
          <StatusCard
            accent={brandColors.lime}
            title={t('favorites.loginTitle')}
            description={t('favorites.loginDescription')}
          />
          <AuthButton
            label={t('auth.signIn')}
            onPress={() =>
              router.push({ pathname: '/sign-in', params: { next: '/(tabs)/favorites' } })
            }
          />
        </>
      )}
    </ScrollView>
  );
}
