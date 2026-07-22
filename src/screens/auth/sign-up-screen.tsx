import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useLocale } from '@/providers/locale-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { signUpWithPassword } from '@/services/auth/auth-service';
import {
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '@/services/auth/auth-validation';
import { brandColors, colors, spacing } from '@/theme';

export function SignUpScreen() {
  const { locale, t } = useLocale();
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
      validateDisplayName(displayName, locale) ??
      validateEmail(email, locale) ??
      validatePassword(password, locale) ??
      (password !== confirmation ? t('auth.passwordMismatch') : undefined) ??
      (!acceptsPrivacy ? t('auth.privacyRequired') : undefined);

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
        setError(t('auth.confirmEmailUnexpected'));
      }
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.signUp')}
      subtitle={t('auth.signUpSubtitle')}
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
            {t('auth.hasAccount')}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/sign-in?next=${encodeURIComponent(destination)}` as Href)}
          >
            <Text style={{ color: brandColors.primary, fontWeight: '800' }}>
              {t('auth.signIn')}
            </Text>
          </Pressable>
        </View>
      }
    >
      {error ? <AuthNotice message={error} /> : null}
      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        label={t('auth.displayName')}
        maxLength={80}
        onChangeText={setDisplayName}
        placeholder={t('auth.displayNamePlaceholder')}
        textContentType="name"
        value={displayName}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label={t('auth.email')}
        onChangeText={setEmail}
        placeholder="turista@ejemplo.com"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label={t('auth.password')}
        onChangeText={setPassword}
        placeholder={t('auth.passwordRules')}
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        label={t('auth.confirmPassword')}
        onChangeText={setConfirmation}
        onSubmitEditing={() => void handleSignUp()}
        placeholder={t('auth.repeatPassword')}
        secureTextEntry
        textContentType="newPassword"
        value={confirmation}
      />

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
        <Switch
          accessibilityLabel={t('auth.acceptPrivacy')}
          onValueChange={setAcceptsPrivacy}
          trackColor={{ false: colors.separator, true: brandColors.lightOcean }}
          thumbColor={acceptsPrivacy ? brandColors.primary : undefined}
          value={acceptsPrivacy}
        />
        <Text
          selectable
          style={{ color: colors.secondaryLabel, flex: 1, fontSize: 13, lineHeight: 19 }}
        >
          {t('auth.privacyNotice')}
        </Text>
      </View>

      <AuthButton
        label={t('auth.signUp')}
        loading={isSubmitting}
        onPress={() => void handleSignUp()}
      />
    </AuthScreenLayout>
  );
}
