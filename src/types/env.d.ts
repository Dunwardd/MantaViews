declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_OS?: 'android' | 'ios' | 'web';
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  }
}
