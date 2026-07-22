import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/app-providers';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigation />
    </AppProviders>
  );
}

function RootNavigation() {
  const { t } = useLocale();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.background,
      text: colors.label,
      primary: brandColors.primary,
      notification: brandColors.sun,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: brandColors.primary,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Detalle del lugar' }} />
        <Stack.Screen name="account-settings" options={{ title: 'Editar cuenta' }} />
        <Stack.Screen name="suggestions" options={{ title: 'Sugerencias' }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="preferences"
          options={{
            presentation: 'modal',
            title: t('preferences.title'),
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
