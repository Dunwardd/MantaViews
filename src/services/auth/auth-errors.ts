import { AuthError } from '@supabase/supabase-js';

import { translate, type TranslationKey } from '@/locales';

const knownMessages: Record<string, TranslationKey> = {
  'Email not confirmed': 'auth.errorEmailUnconfirmed',
  'Invalid login credentials': 'auth.errorCredentials',
  'Password should be at least 6 characters': 'auth.errorPasswordShort',
  'Provider is not enabled': 'auth.errorProvider',
  'Unsupported provider: provider is not enabled': 'auth.errorProvider',
  'User already registered': 'auth.errorRegistered',
  'User not found': 'auth.errorNotFound',
};

export function getAuthErrorMessage(error: unknown, locale: 'es' | 'en' = 'es') {
  if (error instanceof AuthError) {
    if (error.status === 429) {
      return translate(locale, 'auth.errorRateLimit');
    }

    const key = knownMessages[error.message];
    return translate(locale, key ?? 'auth.errorGeneric');
  }

  if (error instanceof Error && error.message === 'OAUTH_CANCELLED') {
    return translate(locale, 'auth.errorCancelled');
  }

  return translate(locale, 'auth.errorConnection');
}
