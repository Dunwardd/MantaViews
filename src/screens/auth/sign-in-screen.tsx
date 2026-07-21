import type { Href } from 'expo-router';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { signInWithGoogle, signInWithPassword } from '@/services/auth/auth-service';
import { validateEmail } from '@/services/auth/auth-validation';
import { brandColors, colors, spacing } from '@/theme';

export function SignInScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = typeof next === 'string' && next.startsWith('/') ? next : '/(tabs)/profile';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await signInWithPassword(email, password);
      router.replace(destination as Href);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(undefined);
    setIsGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session || process.env.EXPO_OS !== 'web') router.replace(destination as Href);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Iniciar sesión"
      subtitle="Explorar es gratis y no requiere cuenta. Inicia sesión para guardar, votar y comentar."
      footer={
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: spacing.xs,
            justifyContent: 'center',
          }}
        >
          <Text selectable style={{ color: colors.secondaryLabel }}>
            ¿No tienes cuenta?
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/sign-up?next=${encodeURIComponent(destination)}` as Href)}
          >
            <Text style={{ color: brandColors.primary, fontWeight: '800' }}>Regístrate</Text>
          </Pressable>
        </View>
      }
    >
      {error ? <AuthNotice message={error} /> : null}
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={setEmail}
        placeholder="turista@ejemplo.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="current-password"
        label="Contraseña"
        onChangeText={setPassword}
        onSubmitEditing={() => void handleSignIn()}
        placeholder="Tu contraseña"
        returnKeyType="done"
        secureTextEntry
        textContentType="password"
        value={password}
      />

      <Link href="/forgot-password" asChild>
        <Pressable hitSlop={8} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: brandColors.primary, fontSize: 14, fontWeight: '700' }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>
      </Link>

      <AuthButton
        label="Iniciar sesión"
        loading={isSubmitting}
        onPress={() => void handleSignIn()}
      />

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ backgroundColor: colors.separator, flex: 1, height: 1 }} />
        <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>o continúa con</Text>
        <View style={{ backgroundColor: colors.separator, flex: 1, height: 1 }} />
      </View>

      <AuthButton
        label="Continuar con Google"
        loading={isGoogleLoading}
        onPress={() => void handleGoogleSignIn()}
        variant="secondary"
      />
    </AuthScreenLayout>
  );
}
