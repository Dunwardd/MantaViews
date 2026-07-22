import { ScrollView } from 'react-native';

import { FeedbackState } from '@/components/ui/feedback-state';
import { colors, layout, spacing } from '@/theme';

export function MapScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      <FeedbackState
        title="Mapa de Manta"
        description="La base de navegación está lista. En la fase de mapas agregaremos ubicación, marcadores y rutas."
      />
    </ScrollView>
  );
}
