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
  const { locale } = useLocale();
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
        <LoadingState label="Consultando tus favoritos…" />
      ) : isAuthenticated && favoritesQuery.isPending ? (
        <LoadingState label="Cargando tus lugares guardados…" />
      ) : isAuthenticated && favoritesQuery.isError ? (
        <FeedbackState
          actionLabel="Reintentar"
          description="No pudimos consultar tus favoritos."
          onAction={() => void favoritesQuery.refetch()}
          title="Favoritos no disponibles"
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
          title="Tus lugares favoritos"
          description="Todavía no has guardado lugares. Cuando marques uno como favorito aparecerá aquí."
        />
      ) : (
        <>
          <StatusCard
            accent={brandColors.lime}
            title="Guarda lugares para después"
            description="Inicia sesión para sincronizar tus playas, restaurantes y actividades favoritas."
          />
          <AuthButton
            label="Iniciar sesión"
            onPress={() =>
              router.push({ pathname: '/sign-in', params: { next: '/(tabs)/favorites' } })
            }
          />
        </>
      )}
    </ScrollView>
  );
}
