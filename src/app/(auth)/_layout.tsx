import { Stack } from 'expo-router/stack';

import { AppBackButton } from '@/components/navigation/app-back-button';
import { brandColors, colors } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerLeft: () => <AppBackButton fallback="/(tabs)/profile" />,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: brandColors.deepTeal,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Recuperar contraseña' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Nueva contraseña' }} />
      <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
    </Stack>
  );
}
