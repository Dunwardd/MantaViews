import { ScrollView } from 'react-native';

import { StatusCard } from '@/components/ui/status-card';
import { brandColors, colors, spacing } from '@/theme';

export function FavoritesScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <StatusCard
        accent={brandColors.lime}
        title="Tus lugares favoritos"
        description="Cuando conectemos la autenticación, aquí se sincronizarán los lugares guardados."
      />
    </ScrollView>
  );
}
