import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { preferencesStorage } from '@/services/storage/preferences-storage';

export type AppLocale = 'es' | 'en';

const translations = {
  es: {
    'tabs.explore': 'Explorar',
    'tabs.map': 'Mapa',
    'tabs.favorites': 'Favoritos',
    'tabs.profile': 'Perfil',
    'preferences.title': 'Preferencias',
    'preferences.language': 'Idioma de la aplicación',
    'preferences.description': 'Elige el idioma que usará MantaViews.',
    'preferences.readyTitle': 'Base bilingüe activa',
    'preferences.readyDescription':
      'La navegación cambia de idioma inmediatamente. Las pantallas restantes se traducirán durante la fase de internacionalización.',
    'language.spanish': 'Español',
    'language.english': 'Inglés',
    'onboarding.title': 'Tu guía para descubrir Manta',
    'onboarding.subtitle':
      'Explora playas, cultura, gastronomía y experiencias elegidas por la comunidad.',
    'onboarding.discoverTitle': 'Descubre lugares',
    'onboarding.discoverDescription': 'Busca y filtra el catálogo turístico desde cualquier lugar.',
    'onboarding.routeTitle': 'Planea tu visita',
    'onboarding.routeDescription': 'Consulta ubicación, horarios, contacto y rutas.',
    'onboarding.communityTitle': 'Viaja con confianza',
    'onboarding.communityDescription': 'Revisa valoraciones y recomendaciones de otros visitantes.',
    'onboarding.start': 'Comenzar a explorar',
  },
  en: {
    'tabs.explore': 'Explore',
    'tabs.map': 'Map',
    'tabs.favorites': 'Favorites',
    'tabs.profile': 'Profile',
    'preferences.title': 'Preferences',
    'preferences.language': 'App language',
    'preferences.description': 'Choose the language MantaViews will use.',
    'preferences.readyTitle': 'Bilingual foundation ready',
    'preferences.readyDescription':
      'Navigation changes language immediately. The remaining screens will be translated during the internationalization phase.',
    'language.spanish': 'Spanish',
    'language.english': 'English',
    'onboarding.title': 'Your guide to discovering Manta',
    'onboarding.subtitle':
      'Explore beaches, culture, food and experiences selected by the community.',
    'onboarding.discoverTitle': 'Discover places',
    'onboarding.discoverDescription': 'Search and filter the tourism catalog from anywhere.',
    'onboarding.routeTitle': 'Plan your visit',
    'onboarding.routeDescription': 'Check locations, schedules, contact details and routes.',
    'onboarding.communityTitle': 'Travel with confidence',
    'onboarding.communityDescription': 'Read ratings and recommendations from other visitors.',
    'onboarding.start': 'Start exploring',
  },
} as const;

type TranslationKey = keyof (typeof translations)['es'];

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
      t: (key) => translations[locale][key],
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
