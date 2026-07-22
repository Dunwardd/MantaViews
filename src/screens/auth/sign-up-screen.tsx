import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { signUpWithPassword } from '@/services/auth/auth-service';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '@/services/auth/auth-validation';
import { brandColors, colors, spacing } from '@/theme';

export function SignUpScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = typeof next === 'string' && next.startsWith('/') ? next : '/(tabs)/profile';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const validationError =
      validateDisplayName(displayName) ??
      validateEmail(email) ??
      validatePassword(password) ??
      (password !== confirmation ? 'Las contraseñas no coinciden.' : undefined) ??
      (!acceptsPrivacy ? 'Debes aceptar el aviso de privacidad para crear la cuenta.' : undefined);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      const data = await signUpWithPassword(displayName, email, password);
      if (data.session) {
        router.replace(destination as Href);
      } else {
        setError(
          'La cuenta fue creada, pero Supabase aún exige confirmar el correo. Desactiva Confirm email en Authentication → Sign In / Providers → Email.',
        );
      }
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Crear cuenta"
      subtitle="Regístrate para participar en la comunidad turística de Manta."
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
            ¿Ya tienes cuenta?
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/sign-in?next=${encodeURIComponent(destination)}` as Href)}
          >
            <Text style={{ color: brandColors.primary, fontWeight: '800' }}>Inicia sesión</Text>
          </Pressable>
        </View>
      }
    >
      {error ? <AuthNotice message={error} /> : null}
      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        label="Nombre visible"
        maxLength={80}
        onChangeText={setDisplayName}
        placeholder="¿Cómo quieres aparecer?"
        textContentType="name"
        value={displayName}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={setEmail}
        placeholder="turista@ejemplo.com"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label="Contraseña"
        onChangeText={setPassword}
        placeholder="8+ caracteres, letra y número"
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label="Confirmar contraseña"
        onChangeText={setConfirmation}
        onSubmitEditing={() => void handleSignUp()}
        placeholder="Repite tu contraseña"
        secureTextEntry
        textContentType="newPassword"
        value={confirmation}
      />

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Switch
          accessibilityLabel="Aceptar aviso de privacidad"
          onValueChange={setAcceptsPrivacy}
          trackColor={{ false: colors.separator, true: brandColors.lightOcean }}
          thumbColor={acceptsPrivacy ? brandColors.primary : undefined}
          value={acceptsPrivacy}
        />
        <Text
          selectable
          style={{ color: colors.secondaryLabel, flex: 1, fontSize: 13, lineHeight: 19 }}
        >
          Acepto que MantaViews use mi nombre y correo para gestionar mi cuenta y participación.
        </Text>
      </View>

      <AuthButton label="Crear cuenta" loading={isSubmitting} onPress={() => void handleSignUp()} />
    </AuthScreenLayout>
  );
}
