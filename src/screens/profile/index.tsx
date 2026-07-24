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
import { useLocale } from '@/providers/locale-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { getCurrentProfile, getCurrentUserIsAdmin } from '@/services/profiles/profile-service';
import { getPublicAvatarUrl } from '@/services/storage/image-service';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function ProfileScreen() {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const { locale, t } = useLocale();
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
      setSignOutError(getAuthErrorMessage(error, locale));
      setIsSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    const message = t('profile.signOutQuestion');

    if (process.env.EXPO_OS === 'web') {
      if (window.confirm(`${t('profile.signOut')}\n\n${message}`)) {
        void handleSignOut();
      }
      return;
    }

    Alert.alert(t('profile.signOut'), message, [
      { style: 'cancel', text: t('common.cancel') },
      {
        style: 'destructive',
        text: t('profile.signOut'),
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
        <LoadingState label={t('profile.loading')} />
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
          title={t('profile.guestTitle')}
          description={t('profile.guestDescription')}
        />
        <AuthButton label={t('auth.signIn')} onPress={() => router.push('/sign-in')} />
        <AuthButton
          label={t('auth.signUp')}
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
          uri={
            getPublicAvatarUrl(profileQuery.data?.avatar_path ?? null) ??
            (typeof user.user_metadata.avatar_url === 'string'
              ? user.user_metadata.avatar_url
              : null)
          }
        />
        <Text selectable style={{ ...typography.title, color: colors.label }}>
          {profileQuery.data?.display_name ??
            user.user_metadata.display_name ??
            t('profile.traveler')}
        </Text>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15 }}>
          {user.email}
        </Text>
        {adminQuery.data ? (
          <>
            <Text
              selectable
              style={{ color: brandColors.primary, fontSize: 13, fontWeight: '800' }}
            >
              {t('profile.admin')}
            </Text>
            <AppButton
              label={t('profile.openAdmin')}
              onPress={() => router.push('/admin' as Href)}
            />
          </>
        ) : null}
      </SurfaceCard>

      {profileQuery.isError ? <AuthNotice message={t('profile.loadError')} /> : null}

      <StatusCard
        title={t('profile.protected')}
        description={`${t(user.email_confirmed_at ? 'profile.emailConfirmed' : 'profile.emailPending')} · ${t(profileQuery.data?.preferred_language === 'en' ? 'profile.languageEnglish' : 'profile.languageSpanish')}`}
      />

      {signOutError ? <AuthNotice message={signOutError} /> : null}

      <AppButton
        icon={<AppIcon color={brandColors.primary} name="settings" size={20} />}
        label={t('profile.preferences')}
        onPress={() => router.push('/preferences' as Href)}
        variant="secondary"
      />

      <AppButton
        label={t('profile.edit')}
        onPress={() => router.push('/account-settings' as Href)}
        variant="secondary"
      />

      <AppButton
        label={t('profile.suggestions')}
        onPress={() => router.push('/suggestions' as Href)}
        variant="secondary"
      />

      <AuthButton
        label={t('profile.signOut')}
        loading={isSigningOut}
        onPress={confirmSignOut}
        variant="secondary"
      />
    </ScrollView>
  );
}
