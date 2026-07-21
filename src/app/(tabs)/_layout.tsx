import { Tabs } from 'expo-router';

import { brandColors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: brandColors.deepTeal,
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: brandColors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorar', tabBarLabel: 'Explorar' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa', tabBarLabel: 'Mapa' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoritos', tabBarLabel: 'Favoritos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarLabel: 'Perfil' }} />
    </Tabs>
  );
}
