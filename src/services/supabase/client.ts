import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase no está configurado. Copia .env.example a .env y completa las variables públicas.',
    );
  }

  client ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      ...(process.env.EXPO_OS === 'web' ? {} : { storage: secureStorage }),
      autoRefreshToken: true,
      detectSessionInUrl: process.env.EXPO_OS === 'web',
      persistSession: true,
    },
  });

  return client;
}
