import { ScrollView } from 'react-native';

import { StatusCard } from '@/components/ui/status-card';
import { brandColors, colors, spacing } from '@/theme';

export function MapScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <StatusCard
        accent={brandColors.ocean}
        title="Mapa de Manta"
        description="La base de navegación está lista. En la fase de mapas agregaremos ubicación, marcadores y rutas."
      />
    </ScrollView>
  );
}
