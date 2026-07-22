import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { PlaceCard } from '@/components/places/place-card';
import { StatusCard } from '@/components/ui/status-card';
import { getTourismCategories } from '@/services/catalog/category-service';
import { getPublishedPlaces, searchTourismPlaces } from '@/services/catalog/place-service';
import { brandColors, colors, spacing } from '@/theme';

export function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories('es'),
    queryKey: ['public', 'categories', 'es'],
  });
  const hasActiveFilters = debouncedSearch.length > 0 || selectedCategoryId !== null;
  const placesQuery = useQuery({
    queryFn: () =>
      hasActiveFilters
        ? searchTourismPlaces({
            categoryId: selectedCategoryId,
            limit: 20,
            locale: 'es',
            query: debouncedSearch,
          })
        : getPublishedPlaces('es'),
    queryKey: [
      'public',
      'places',
      'es',
      { categoryId: selectedCategoryId, limit: hasActiveFilters ? 20 : 8, query: debouncedSearch },
    ],
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: spacing.xl, padding: spacing.lg }}
      keyboardShouldPersistTaps="handled"
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

      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '800' }}>
          ¿Qué quieres conocer?
        </Text>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.separator,
            borderCurve: 'continuous',
            borderRadius: 18,
            borderWidth: 1,
            flexDirection: 'row',
            gap: spacing.sm,
            minHeight: 52,
            paddingHorizontal: spacing.md,
          }}
        >
          <Text accessibilityElementsHidden style={{ fontSize: 18 }}>
            🔎
          </Text>
          <TextInput
            accessibilityLabel="Buscar lugares turísticos"
            autoCapitalize="sentences"
            autoCorrect={false}
            maxLength={100}
            onChangeText={setSearchText}
            placeholder="Busca una playa, museo o actividad"
            placeholderTextColor={colors.secondaryLabel}
            returnKeyType="search"
            style={{ color: colors.label, flex: 1, fontSize: 16, paddingVertical: spacing.md }}
            value={searchText}
          />
          {searchText.length > 0 ? (
            <Pressable
              accessibilityLabel="Limpiar búsqueda"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setSearchText('')}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: spacing.xs })}
            >
              <Text style={{ color: brandColors.primary, fontSize: 14, fontWeight: '800' }}>
                Limpiar
              </Text>
            </Pressable>
          ) : null}
        </View>
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
            <RetryButton onPress={() => void categoriesQuery.refetch()} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Pressable
              accessibilityLabel="Mostrar todas las categorías"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategoryId === null }}
              onPress={() => setSelectedCategoryId(null)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: selectedCategoryId === null ? brandColors.primary : colors.surface,
                borderColor: brandColors.primary,
                borderRadius: 999,
                borderWidth: 1,
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: spacing.md,
                paddingVertical: 10,
              })}
            >
              <Text
                style={{
                  color: selectedCategoryId === null ? brandColors.white : brandColors.primary,
                  fontSize: 14,
                  fontWeight: '800',
                }}
              >
                Todas
              </Text>
            </Pressable>
            {categoriesQuery.data.map((category) => (
              <Pressable
                accessibilityLabel={`Filtrar por ${category.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategoryId === category.id }}
                key={category.id}
                onPress={() =>
                  setSelectedCategoryId((currentId) =>
                    currentId === category.id ? null : category.id,
                  )
                }
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor:
                    selectedCategoryId === category.id ? category.color : `${category.color}18`,
                  borderColor: category.color,
                  borderRadius: 999,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 10,
                })}
              >
                <View
                  style={{
                    backgroundColor:
                      selectedCategoryId === category.id ? brandColors.white : category.color,
                    borderRadius: 999,
                    height: 9,
                    width: 9,
                  }}
                />
                <Text
                  style={{
                    color: selectedCategoryId === category.id ? brandColors.white : colors.label,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '800' }}>
            Lugares para descubrir
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14 }}>
            {hasActiveFilters
              ? 'Resultados del catálogo turístico de Manta'
              : 'Una primera selección de playas, cultura y espacios de Manta'}
          </Text>
        </View>

        {placesQuery.isPending ? (
          <View style={{ alignItems: 'center', padding: spacing.xl }}>
            <ActivityIndicator color={brandColors.primary} />
          </View>
        ) : placesQuery.isError ? (
          <View style={{ gap: spacing.md }}>
            <AuthNotice message="No pudimos consultar los lugares turísticos. Revisa tu conexión a internet." />
            <RetryButton onPress={() => void placesQuery.refetch()} />
          </View>
        ) : placesQuery.data.length === 0 ? (
          <StatusCard
            title="Sin resultados"
            description="Prueba otra búsqueda o selecciona una categoría diferente."
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {placesQuery.data.map((place) => {
              const category = categoriesQuery.data?.find(
                (item) => item.id === place.categoryId || item.slug === place.categorySlug,
              );
              const categoryName = category?.name ?? place.categorySlug.replaceAll('-', ' ');
              const displayPlace = {
                ...place,
                categoryColor: category?.color ?? place.categoryColor,
              };

              return <PlaceCard categoryName={categoryName} key={place.id} place={displayPlace} />;
            })}
          </View>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <StatusCard
          title="Conexión cloud activa"
          description={
            categoriesQuery.data
              ? `${categoriesQuery.data.length} categorías y ${placesQuery.data?.length ?? 0} lugares recibidos desde MantaViews.`
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

type RetryButtonProps = {
  onPress: () => void;
};

function RetryButton({ onPress }: RetryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: brandColors.primary,
        borderRadius: 14,
        opacity: pressed ? 0.75 : 1,
        padding: spacing.md,
      })}
    >
      <Text selectable style={{ color: brandColors.white, fontWeight: '800' }}>
        Reintentar
      </Text>
    </Pressable>
  );
}
