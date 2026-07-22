import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { createSessionFromUrl } from '@/services/auth/auth-service';

export function AuthCallbackScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = typeof next === 'string' && next.startsWith('/') ? next : '/(tabs)/profile';
  const incomingUrl = Linking.useURL();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!incomingUrl) return;

    void createSessionFromUrl(incomingUrl)
      .then(() => router.replace(destination as Href))
      .catch((caughtError: unknown) => setError(getAuthErrorMessage(caughtError)));
  }, [destination, incomingUrl]);

  return (
    <AuthScreenLayout
      title="Confirmando acceso"
      subtitle="Estamos validando de forma segura el enlace de autenticación."
    >
      {error ? (
        <>
          <AuthNotice message={error} />
          <AuthButton label="Volver al login" onPress={() => router.replace('/sign-in')} />
        </>
      ) : (
        <AuthButton disabled label="Validando…" loading onPress={() => undefined} />
      )}
    </AuthScreenLayout>
  );
}
