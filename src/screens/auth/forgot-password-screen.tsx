import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useLocale } from '@/providers/locale-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { requestPasswordReset } from '@/services/auth/auth-service';
import { validateEmail } from '@/services/auth/auth-validation';
import { brandColors, colors } from '@/theme';

export function ForgotPasswordScreen() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async () => {
    const validationError = validateEmail(email, locale);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setSuccess(undefined);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSuccess(t('auth.resetSent'));
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.recover')}
      subtitle={t('auth.recoverSubtitle')}
      footer={
        <View
          style={{ alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' }}
        >
          <Text selectable style={{ color: colors.secondaryLabel }}>
            {t('auth.remembered')}
          </Text>
          <Link href="/sign-in" style={{ color: brandColors.primary, fontWeight: '800' }}>
            {t('auth.backToLogin')}
          </Link>
        </View>
      }
    >
      {error ? <AuthNotice message={error} /> : null}
      {success ? <AuthNotice message={success} tone="success" /> : null}
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label={t('auth.email')}
        onChangeText={setEmail}
        onSubmitEditing={() => void handleRequest()}
        placeholder="turista@ejemplo.com"
        returnKeyType="send"
        textContentType="emailAddress"
        value={email}
      />
      <AuthButton
        label={t('auth.sendLink')}
        loading={isSubmitting}
        onPress={() => void handleRequest()}
      />
    </AuthScreenLayout>
  );
}
