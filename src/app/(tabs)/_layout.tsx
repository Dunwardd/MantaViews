import { Tabs } from 'expo-router';

import { ProfileHeaderButton } from '@/components/navigation/profile-header-button';
import { AppIcon } from '@/components/ui/app-icon';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors, typography } from '@/theme';

export default function TabsLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <ProfileHeaderButton />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: brandColors.deepTeal,
        headerTitleStyle: { ...typography.bodyStrong, color: colors.label },
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: brandColors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.explore'),
          tabBarLabel: t('tabs.explore'),
          tabBarIcon: ({ color, focused, size }) => (
            <AppIcon color={color} filled={focused} name="compass" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabs.map'),
          tabBarLabel: t('tabs.map'),
          tabBarIcon: ({ color, focused, size }) => (
            <AppIcon color={color} filled={focused} name="map" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarLabel: t('tabs.favorites'),
          tabBarIcon: ({ color, focused, size }) => (
            <AppIcon color={color} filled={focused} name="heart" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
