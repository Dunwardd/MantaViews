import { router } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { brandColors, colors, spacing } from '@/theme';

export function FavoritesScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      {isLoading ? (
        <ActivityIndicator color={brandColors.primary} />
      ) : isAuthenticated ? (
        <StatusCard
          accent={brandColors.lime}
          title="Tus lugares favoritos"
          description="Tu sesión está activa. La lista sincronizada de lugares se conectará en la fase de endpoints sociales."
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
