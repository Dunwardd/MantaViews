import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { LoadingState } from '@/components/ui/feedback-state';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { getCurrentProfile, getCurrentUserIsAdmin } from '@/services/profiles/profile-service';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function ProfileScreen() {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const profileQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getCurrentProfile(user!.id),
    queryKey: ['private', 'profile', user?.id],
  });
  const adminQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: getCurrentUserIsAdmin,
    queryKey: ['private', 'is-admin', user?.id],
  });

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
      router.replace('/(tabs)');
    } catch (error: unknown) {
      setSignOutError(getAuthErrorMessage(error));
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    const message = 'Se eliminará la sesión guardada en este dispositivo.';

    if (process.env.EXPO_OS === 'web') {
      if (window.confirm(`Cerrar sesión\n\n${message}`)) {
        void handleSignOut();
      }
      return;
    }

    Alert.alert('Cerrar sesión', message, [
      { style: 'cancel', text: 'Cancelar' },
      {
        style: 'destructive',
        text: 'Cerrar sesión',
        onPress: () => void handleSignOut(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: 'center',
          alignSelf: 'center',
          maxWidth: layout.contentMaxWidth,
          padding: spacing.xl,
          width: '100%',
        }}
        style={{ backgroundColor: colors.background }}
      >
        <LoadingState label="Preparando tu perfil…" />
      </ScrollView>
    );
  }

  if (!isAuthenticated || !user) {
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
        <StatusCard
          accent={brandColors.sun}
          title="Explora como invitado"
          description="Inicia sesión solo cuando quieras comentar, votar, guardar lugares o enviar sugerencias."
        />
        <AuthButton label="Iniciar sesión" onPress={() => router.push('/sign-in')} />
        <AuthButton
          label="Crear cuenta"
          onPress={() => router.push('/sign-up')}
          variant="secondary"
        />
      </ScrollView>
    );
  }

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
      <SurfaceCard>
        <AppAvatar
          label={profileQuery.data?.display_name ?? user.email ?? 'MantaViews'}
          size={64}
          uri={null}
        />
        <Text selectable style={{ ...typography.title, color: colors.label }}>
          {profileQuery.data?.display_name ?? user.user_metadata.display_name ?? 'Viajero de Manta'}
        </Text>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15 }}>
          {user.email}
        </Text>
        {adminQuery.data ? (
          <Text selectable style={{ color: brandColors.primary, fontSize: 13, fontWeight: '800' }}>
            Administrador de MantaViews
          </Text>
        ) : null}
      </SurfaceCard>

      {profileQuery.isError ? (
        <AuthNotice message="Tu sesión está activa, pero no pudimos cargar el perfil. Intenta nuevamente." />
      ) : null}

      <StatusCard
        title="Cuenta protegida"
        description={`Correo ${user.email_confirmed_at ? 'confirmado' : 'pendiente de confirmación'} · Idioma ${profileQuery.data?.preferred_language === 'en' ? 'inglés' : 'español'}`}
      />

      {signOutError ? <AuthNotice message={signOutError} /> : null}

      <AppButton
        icon={<AppIcon color={brandColors.primary} name="settings" size={20} />}
        label="Preferencias"
        onPress={() => router.push('/preferences' as Href)}
        variant="secondary"
      />

      <AuthButton
        label="Cerrar sesión"
        loading={isSigningOut}
        onPress={confirmSignOut}
        variant="secondary"
      />
    </ScrollView>
  );
}
