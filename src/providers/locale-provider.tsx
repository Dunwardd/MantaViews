import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { translate, type TranslationKey } from '@/locales';
import { preferencesStorage } from '@/services/storage/preferences-storage';

export type AppLocale = 'es' | 'en';

type LocaleContextValue = {
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const PREFERENCES_KEY = 'mantaviews.preferences.v1';

type StoredPreferences = {
  hasCompletedOnboarding: boolean;
  locale: AppLocale;
};

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>('es');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = preferencesStorage.getItem(PREFERENCES_KEY);
      if (storedValue) {
        const stored = JSON.parse(storedValue) as Partial<StoredPreferences>;
        if (stored.locale === 'es' || stored.locale === 'en') setLocale(stored.locale);
        setHasCompletedOnboarding(Boolean(stored.hasCompletedOnboarding));
      }
    } catch {
      // A storage failure must not prevent the app from starting.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persist = useCallback((next: StoredPreferences) => {
    try {
      preferencesStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    } catch {
      // The in-memory preference remains usable for the active session.
    }
  }, []);

  const updateLocale = useCallback(
    (nextLocale: AppLocale) => {
      setLocale(nextLocale);
      persist({ hasCompletedOnboarding, locale: nextLocale });
    },
    [hasCompletedOnboarding, persist],
  );

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    persist({ hasCompletedOnboarding: true, locale });
  }, [locale, persist]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      completeOnboarding,
      hasCompletedOnboarding,
      isHydrated,
      locale,
      setLocale: updateLocale,
      t: (key) => translate(locale, key),
    }),
    [completeOnboarding, hasCompletedOnboarding, isHydrated, locale, updateLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale() {
  const value = use(LocaleContext);
  if (!value) throw new Error('useLocale debe usarse dentro de LocaleProvider.');
  return value;
}
