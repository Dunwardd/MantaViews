import { en } from './en';
import { es, type TranslationKey } from './es';

export const translations = { en, es } as const;
export type { TranslationKey };

export function translate(locale: 'es' | 'en', key: TranslationKey) {
  return translations[locale]?.[key] ?? es[key];
}
