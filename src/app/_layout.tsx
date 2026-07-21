import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AppProviders } from '@/providers/app-providers';
import { brandColors } from '@/theme/colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: brandColors.primary,
      notification: brandColors.sun,
    },
  };

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: brandColors.primary,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProviders>
  );
}
