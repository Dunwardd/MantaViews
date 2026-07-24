import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppBackButton } from '@/components/navigation/app-back-button';
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
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: brandColors.deepTeal,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="place/[id]"
          options={{
            headerLeft: () => <AppBackButton fallback="/(tabs)" />,
            title: t('navigation.placeDetail'),
          }}
        />
        <Stack.Screen
          name="account-settings"
          options={{
            headerLeft: () => <AppBackButton fallback="/(tabs)/profile" />,
            title: t('navigation.accountSettings'),
          }}
        />
        <Stack.Screen
          name="suggestions"
          options={{
            headerLeft: () => <AppBackButton fallback="/(tabs)/profile" />,
            title: t('navigation.suggestions'),
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerLeft: () => <AppBackButton fallback="/(tabs)/profile" />,
            title: t('navigation.admin'),
          }}
        />
        <Stack.Screen
          name="preferences"
          options={{
            headerLeft: () => <AppBackButton fallback="/(tabs)/profile" />,
            presentation: 'modal',
            title: t('preferences.title'),
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
