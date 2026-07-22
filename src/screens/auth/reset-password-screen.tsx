import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { createSessionFromUrl, updatePassword } from '@/services/auth/auth-service';
import { validatePassword } from '@/services/auth/auth-validation';

export function ResetPasswordScreen() {
  const { locale, t } = useLocale();
  const incomingUrl = Linking.useURL();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [isPreparing, setIsPreparing] = useState(!session);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setIsPreparing(false);
      return;
    }
    if (!incomingUrl) return;

    void createSessionFromUrl(incomingUrl)
      .then((createdSession) => {
        if (!createdSession) setError(t('auth.invalidResetLink'));
      })
      .catch((caughtError: unknown) => setError(getAuthErrorMessage(caughtError, locale)))
      .finally(() => setIsPreparing(false));
  }, [incomingUrl, locale, session, t]);

  const handleUpdate = async () => {
    const validationError =
      validatePassword(password, locale) ??
      (password !== confirmation ? t('auth.passwordMismatch') : undefined);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      router.replace('/(tabs)/profile');
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout title={t('auth.newPassword')} subtitle={t('auth.newPasswordSubtitle')}>
      {error ? <AuthNotice message={error} /> : null}
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isPreparing && Boolean(session)}
        label={t('auth.newPassword')}
        onChangeText={setPassword}
        placeholder={t('auth.passwordRules')}
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isPreparing && Boolean(session)}
        label={t('auth.confirmPassword')}
        onChangeText={setConfirmation}
        onSubmitEditing={() => void handleUpdate()}
        placeholder={t('auth.repeatPassword')}
        secureTextEntry
        textContentType="newPassword"
        value={confirmation}
      />
      <AuthButton
        disabled={!session}
        label={isPreparing ? t('auth.validatingLink') : t('auth.savePassword')}
        loading={isPreparing || isSubmitting}
        onPress={() => void handleUpdate()}
      />
    </AuthScreenLayout>
  );
}
