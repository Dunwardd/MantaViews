import { Stack } from 'expo-router/stack';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
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
