import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { brandColors, colors, layout, spacing } from '@/theme';

export function FavoritesScreen() {
  const { isAuthenticated, isLoading } = useAuth();

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
