import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';

import { StatusCard } from '@/components/ui/status-card';
import { brandColors, colors, spacing } from '@/theme';

export function ExploreScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: spacing.xl, padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: brandColors.sand,
          borderCurve: 'continuous',
          borderRadius: 28,
          gap: spacing.md,
          padding: spacing.xl,
        }}
      >
        <Image
          source={require('../../../assets/images/brand-logo.jpeg')}
          contentFit="contain"
          style={{ borderRadius: 24, height: 150, width: 150 }}
        />
        <Text selectable style={{ color: brandColors.deepTeal, fontSize: 30, fontWeight: '800' }}>
          MantaViews
        </Text>
        <Text
          selectable
          style={{
            color: colors.secondaryLabel,
            fontSize: 16,
            lineHeight: 24,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          Descubre, explora y vive los mejores lugares turísticos de Manta.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <StatusCard
          title="Lugares destacados"
          description="Aquí aparecerán playas, restaurantes, museos y actividades seleccionadas."
        />
        <StatusCard
          accent={brandColors.sun}
          title="Recomendados para ti"
          description="Las recomendaciones usarán tus intereses, valoraciones y cercanía sin guardar tu ubicación."
        />
      </View>
    </ScrollView>
  );
}
