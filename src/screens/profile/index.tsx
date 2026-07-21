import { ScrollView } from 'react-native';

import { StatusCard } from '@/components/ui/status-card';
import { brandColors, colors, spacing } from '@/theme';

export function ProfileScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <StatusCard
        accent={brandColors.sun}
        title="Explora como invitado"
        description="Más adelante podrás iniciar sesión para comentar, votar, guardar lugares y enviar sugerencias."
      />
    </ScrollView>
  );
}
