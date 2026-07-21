import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthField } from '@/components/auth/auth-field';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AuthScreenLayout } from '@/components/auth/auth-screen-layout';
import { useAuth } from '@/providers/auth-provider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { createSessionFromUrl, updatePassword } from '@/services/auth/auth-service';
import { validatePassword } from '@/services/auth/auth-validation';

export function ResetPasswordScreen() {
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
        if (!createdSession) setError('El enlace no contiene una sesión válida o ya expiró.');
      })
      .catch((caughtError: unknown) => setError(getAuthErrorMessage(caughtError)))
      .finally(() => setIsPreparing(false));
  }, [incomingUrl, session]);

  const handleUpdate = async () => {
    const validationError =
      validatePassword(password) ??
      (password !== confirmation ? 'Las contraseñas no coinciden.' : undefined);
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
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña distinta y difícil de adivinar."
    >
      {error ? <AuthNotice message={error} /> : null}
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isPreparing && Boolean(session)}
        label="Nueva contraseña"
        onChangeText={setPassword}
        placeholder="8+ caracteres, letra y número"
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <AuthField
        autoCapitalize="none"
        autoComplete="new-password"
        editable={!isPreparing && Boolean(session)}
        label="Confirmar contraseña"
        onChangeText={setConfirmation}
        onSubmitEditing={() => void handleUpdate()}
        placeholder="Repite tu contraseña"
        secureTextEntry
        textContentType="newPassword"
        value={confirmation}
      />
      <AuthButton
        disabled={!session}
        label={isPreparing ? 'Validando enlace…' : 'Guardar contraseña'}
        loading={isPreparing || isSubmitting}
        onPress={() => void handleUpdate()}
      />
    </AuthScreenLayout>
  );
}
