import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useLocale } from '@/providers/locale-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { createSessionFromUrl } from '@/services/auth/auth-service';

export function AuthCallbackScreen() {
  const { locale, t } = useLocale();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = typeof next === 'string' && next.startsWith('/') ? next : '/(tabs)/profile';
  const incomingUrl = Linking.useURL();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!incomingUrl) return;

    void createSessionFromUrl(incomingUrl)
      .then(() => router.replace(destination as Href))
      .catch((caughtError: unknown) => setError(getAuthErrorMessage(caughtError, locale)));
  }, [destination, incomingUrl, locale]);

  return (
    <AuthScreenLayout title={t('auth.confirming')} subtitle={t('auth.confirmingSubtitle')}>
      {error ? (
        <>
          <AuthNotice message={error} />
          <AuthButton label={t('auth.backToLogin')} onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <AuthButton disabled label={t('auth.validating')} loading onPress={() => undefined} />
      )}
    </AuthScreenLayout>
  );
}
