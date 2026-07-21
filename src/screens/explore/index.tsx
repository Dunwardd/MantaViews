import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { StatusCard } from '@/components/ui/status-card';
import { getTourismCategories } from '@/services/catalog/category-service';
import { brandColors, colors, spacing } from '@/theme';

export function ExploreScreen() {
  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories('es'),
    queryKey: ['public', 'categories', 'es'],
  });

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
        <View style={{ gap: spacing.xs }}>
          <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '800' }}>
            Explora por categoría
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14 }}>
            Datos consultados en tiempo real desde Supabase Cloud
          </Text>
        </View>

        {categoriesQuery.isPending ? (
          <View style={{ alignItems: 'center', padding: spacing.xl }}>
            <ActivityIndicator color={brandColors.primary} />
          </View>
        ) : categoriesQuery.isError ? (
          <View style={{ gap: spacing.md }}>
            <AuthNotice message="No pudimos consultar las categorías. Revisa tu conexión a internet." />
            <Pressable
              accessibilityRole="button"
              onPress={() => void categoriesQuery.refetch()}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: brandColors.primary,
                borderRadius: 14,
                opacity: pressed ? 0.75 : 1,
                padding: spacing.md,
              })}
            >
              <Text style={{ color: brandColors.white, fontWeight: '800' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {categoriesQuery.data.map((category) => (
              <View
                key={category.id}
                style={{
                  alignItems: 'center',
                  backgroundColor: `${category.color}18`,
                  borderColor: category.color,
                  borderRadius: 999,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 10,
                }}
              >
                <View
                  style={{
                    backgroundColor: category.color,
                    borderRadius: 999,
                    height: 9,
                    width: 9,
                  }}
                />
                <Text selectable style={{ color: colors.label, fontSize: 14, fontWeight: '700' }}>
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <StatusCard
          title="Conexión cloud activa"
          description={
            categoriesQuery.data
              ? `${categoriesQuery.data.length} categorías turísticas recibidas desde el proyecto MantaViews.`
              : 'Comprobando el catálogo público de MantaViews.'
          }
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
