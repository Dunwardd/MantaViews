import { displayNameSchema, emailSchema, passwordSchema } from '@contracts/api-schemas';
import { translate } from '@/locales';

export function validateEmail(email: string, locale: 'es' | 'en' = 'es') {
  return emailSchema.safeParse(email).success
    ? undefined
    : translate(locale, 'auth.validationEmail');
}

export function validatePassword(password: string, locale: 'es' | 'en' = 'es') {
  return passwordSchema.safeParse(password).success
    ? undefined
    : translate(locale, 'auth.validationPassword');
}

export function validateDisplayName(displayName: string, locale: 'es' | 'en' = 'es') {
  return displayNameSchema.safeParse(displayName).success
    ? undefined
    : translate(locale, 'auth.validationName');
}
