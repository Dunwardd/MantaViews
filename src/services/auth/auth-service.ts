import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { getSupabaseClient } from '@/services/supabase/client';

WebBrowser.maybeCompleteAuthSession();

export const authRedirects = {
  callback: makeRedirectUri({ path: 'auth-callback', scheme: 'mantaviews' }),
  resetPassword: makeRedirectUri({ path: 'reset-password', scheme: 'mantaviews' }),
};

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data.session;
}

export async function signUpWithPassword(displayName: string, email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: authRedirects.callback,
    },
  });

  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email: string) {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: authRedirects.resetPassword },
  );

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const code = typeof params.code === 'string' ? params.code : undefined;
  if (code) {
    const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await getSupabaseClient().auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirects.callback,
      skipBrowserRedirect: process.env.EXPO_OS !== 'web',
    },
  });

  if (error) throw error;
  if (process.env.EXPO_OS === 'web') return null;
  if (!data.url) throw new Error('No se recibió la URL de Google OAuth.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirects.callback);
  if (result.type === 'cancel' || result.type === 'dismiss') throw new Error('OAUTH_CANCELLED');
  if (result.type !== 'success') return null;

  return createSessionFromUrl(result.url);
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}
