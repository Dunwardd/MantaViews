import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthNotice } from '@/components/auth/auth-notice';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { getCurrentProfile, getCurrentUserIsAdmin } from '@/services/profiles/profile-service';
import { brandColors, colors, spacing } from '@/theme';

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

    if (Platform.OS === 'web') {
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
        contentContainerStyle={{ alignItems: 'center', padding: spacing.xl }}
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={brandColors.primary} />
      </ScrollView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg }}
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
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderCurve: 'continuous',
          borderRadius: 24,
          borderWidth: 1,
          gap: spacing.sm,
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: brandColors.lightOcean,
            borderRadius: 999,
            height: 64,
            justifyContent: 'center',
            width: 64,
          }}
        >
          <Text style={{ color: brandColors.deepTeal, fontSize: 26, fontWeight: '800' }}>
            {(profileQuery.data?.display_name ?? user.email ?? 'M').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text selectable style={{ color: colors.label, fontSize: 24, fontWeight: '800' }}>
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
      </View>

      {profileQuery.isError ? (
        <AuthNotice message="Tu sesión está activa, pero no pudimos cargar el perfil. Intenta nuevamente." />
      ) : null}

      <StatusCard
        title="Cuenta protegida"
        description={`Correo ${user.email_confirmed_at ? 'confirmado' : 'pendiente de confirmación'} · Idioma ${profileQuery.data?.preferred_language === 'en' ? 'inglés' : 'español'}`}
      />

      {signOutError ? <AuthNotice message={signOutError} /> : null}

      <AuthButton
        label="Cerrar sesión"
        loading={isSigningOut}
        onPress={confirmSignOut}
        variant="secondary"
      />
    </ScrollView>
  );
}
