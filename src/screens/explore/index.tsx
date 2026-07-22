import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PlaceCard } from '@/components/places/place-card';
import { RecommendationCard } from '@/components/places/recommendation-card';
import { AppButton } from '@/components/ui/app-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { StatusCard } from '@/components/ui/status-card';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getTourismCategories } from '@/services/catalog/category-service';
import {
  getTourismRecommendations,
  searchTourismPlaces,
  type TourismPlace,
} from '@/services/catalog/place-service';
import { brandColors, colors, layout, spacing } from '@/theme';
import { distanceInMeters, MANTA_CENTER } from '@/utils/geo';

const PAGE_SIZE = 4;

export function ExploreScreen() {
  const { locale, t } = useLocale();
  const distanceOptions = [
    { label: t('explore.all'), value: null },
    { label: t('explore.distance3'), value: 3_000 },
    { label: t('explore.distance8'), value: 8_000 },
    { label: t('explore.distance15'), value: 15_000 },
  ] as const;
  const ratingOptions = [
    { label: t('explore.all'), value: 0 },
    { label: t('explore.rating3'), value: 3 },
    { label: t('explore.rating4'), value: 4 },
  ] as const;
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [maximumDistance, setMaximumDistance] = useState<number | null>(null);
  const [minimumRating, setMinimumRating] = useState(0);
  const [recommendationLocation, setRecommendationLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocatingRecommendations, setIsLocatingRecommendations] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories(locale),
    queryKey: ['public', 'categories', locale],
  });

  const recommendationsQuery = useQuery({
    queryFn: () => getTourismRecommendations(locale, 4, recommendationLocation),
    queryKey: [
      'public',
      'recommendations',
      locale,
      user?.id ?? 'guest',
      recommendationLocation?.latitude,
      recommendationLocation?.longitude,
      4,
    ],
  });

  const improveRecommendationsWithLocation = async () => {
    if (isLocatingRecommendations) return;
    setIsLocatingRecommendations(true);
    setLocationNotice(null);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setLocationNotice(t('explore.locationDenied'));
        return;
      }
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 1_000,
      });
      const current =
        lastKnown ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setRecommendationLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setLocationNotice(t('explore.locationUsed'));
    } catch {
      setLocationNotice(t('explore.locationError'));
    } finally {
      setIsLocatingRecommendations(false);
    }
  };

  const placesQuery = useInfiniteQuery<
    TourismPlace[],
    Error,
    InfiniteData<TourismPlace[], number>,
    readonly unknown[],
    number
  >({
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      searchTourismPlaces({
        categoryId: selectedCategoryId,
        limit: PAGE_SIZE,
        locale,
        offset: pageParam,
        query: debouncedSearch,
      }),
    queryKey: [
      'public',
      'places',
      locale,
      { categoryId: selectedCategoryId, query: debouncedSearch },
    ],
  });

  const loadedPlaces = useMemo(
    () =>
      (placesQuery.data?.pages.flat() ?? []).map<TourismPlace>((place) => ({
        ...place,
        distanceMeters:
          place.latitude !== undefined && place.longitude !== undefined
            ? distanceInMeters(MANTA_CENTER, {
                latitude: place.latitude,
                longitude: place.longitude,
              })
            : undefined,
      })),
    [placesQuery.data],
  );

  const visiblePlaces = loadedPlaces.filter(
    (place) =>
      (place.averageRating ?? 0) >= minimumRating &&
      (maximumDistance === null ||
        (place.distanceMeters !== undefined && place.distanceMeters <= maximumDistance)),
  );

  const hasLocalFilters = minimumRating > 0 || maximumDistance !== null;
  const clearFilters = () => {
    setSearchText('');
    setDebouncedSearch('');
    setSelectedCategoryId(null);
    setMaximumDistance(null);
    setMinimumRating(0);
  };

  const categoryFor = (place: TourismPlace) =>
    categoriesQuery.data?.find(
      (category) => category.id === place.categoryId || category.slug === place.categorySlug,
    );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.xl,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
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
          accessibilityLabel={t('explore.logo')}
          source={require('../../../assets/images/mantaviews-app-icon.png')}
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
          {t('explore.hero')}
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '800' }}>
          {t('explore.question')}
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
            accessibilityLabel={t('explore.searchLabel')}
            autoCapitalize="sentences"
            autoCorrect={false}
            maxLength={100}
            onChangeText={setSearchText}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={colors.secondaryLabel}
            returnKeyType="search"
            style={{ color: colors.label, flex: 1, fontSize: 16, paddingVertical: spacing.md }}
            value={searchText}
          />
          {searchText.length > 0 ? (
            <Pressable
              accessibilityLabel={t('explore.clearSearch')}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setSearchText('')}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: spacing.xs })}
            >
              <Text style={{ color: brandColors.primary, fontSize: 14, fontWeight: '800' }}>
                {t('explore.clear')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeading
          description={t('explore.categoriesDescription')}
          title={t('explore.categoriesTitle')}
        />
        {categoriesQuery.isPending ? (
          <LoadingState label={t('explore.categoriesLoading')} />
        ) : categoriesQuery.isError ? (
          <FeedbackState
            actionLabel={t('common.retry')}
            description={t('explore.categoriesErrorDescription')}
            onAction={() => void categoriesQuery.refetch()}
            title={t('explore.categoriesErrorTitle')}
            tone="error"
          />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <FilterChip
              label={t('explore.all')}
              onPress={() => setSelectedCategoryId(null)}
              selected={selectedCategoryId === null}
            />
            {categoriesQuery.data.map((category) => (
              <FilterChip
                color={category.color}
                key={category.id}
                label={category.name}
                onPress={() =>
                  setSelectedCategoryId((currentId) =>
                    currentId === category.id ? null : category.id,
                  )
                }
                selected={selectedCategoryId === category.id}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeading
          description={t('explore.filtersDescription')}
          title={t('explore.filtersTitle')}
        />
        <Text selectable style={{ color: colors.label, fontSize: 14, fontWeight: '800' }}>
          {t('explore.distance')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {distanceOptions.map((option) => (
            <FilterChip
              key={option.label}
              label={option.label}
              onPress={() => setMaximumDistance(option.value)}
              selected={maximumDistance === option.value}
            />
          ))}
        </View>
        <Text selectable style={{ color: colors.label, fontSize: 14, fontWeight: '800' }}>
          {t('explore.rating')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {ratingOptions.map((option) => (
            <FilterChip
              key={option.label}
              label={option.label}
              onPress={() => setMinimumRating(option.value)}
              selected={minimumRating === option.value}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeading
          description={user ? t('explore.recommendationsUser') : t('explore.recommendationsGuest')}
          title={t('explore.recommendationsTitle')}
        />
        <AppButton
          label={recommendationLocation ? t('explore.updateLocation') : t('explore.useLocation')}
          loading={isLocatingRecommendations}
          onPress={() => void improveRecommendationsWithLocation()}
          variant="secondary"
        />
        {locationNotice ? (
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13 }}>
            {locationNotice}
          </Text>
        ) : null}
        {recommendationsQuery.isPending ? (
          <LoadingState label={t('explore.recommendationsLoading')} />
        ) : recommendationsQuery.isError ? (
          <FeedbackState
            actionLabel={t('common.retry')}
            description={t('explore.recommendationsErrorDescription')}
            onAction={() => void recommendationsQuery.refetch()}
            title={t('explore.recommendationsErrorTitle')}
            tone="error"
          />
        ) : recommendationsQuery.data.length === 0 ? (
          <FeedbackState
            description={t('explore.recommendationsEmptyDescription')}
            title={t('explore.recommendationsEmptyTitle')}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ gap: spacing.md }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recommendationsQuery.data.map((recommendation) => {
              const category = categoryFor(recommendation);
              return (
                <RecommendationCard
                  categoryColor={category?.color ?? recommendation.categoryColor}
                  categoryName={category?.name ?? recommendation.categorySlug.replaceAll('-', ' ')}
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeading
          description={`${visiblePlaces.length} / ${loadedPlaces.length} ${t('explore.placesMatch')}`}
          title={t('explore.placesTitle')}
        />

        {placesQuery.isPending ? (
          <LoadingState label={t('explore.placesLoading')} />
        ) : placesQuery.isError ? (
          <FeedbackState
            actionLabel={t('common.retry')}
            description={t('explore.placesErrorDescription')}
            onAction={() => void placesQuery.refetch()}
            title={t('explore.placesErrorTitle')}
            tone="error"
          />
        ) : visiblePlaces.length === 0 ? (
          <FeedbackState
            actionLabel={
              placesQuery.hasNextPage && hasLocalFilters
                ? t('explore.moreResults')
                : t('explore.clearFilters')
            }
            description={t('explore.noResultsDescription')}
            onAction={() =>
              placesQuery.hasNextPage && hasLocalFilters
                ? void placesQuery.fetchNextPage()
                : clearFilters()
            }
            title={t('explore.noResultsTitle')}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {visiblePlaces.map((place) => {
              const category = categoryFor(place);
              return (
                <PlaceCard
                  categoryName={category?.name ?? place.categorySlug.replaceAll('-', ' ')}
                  key={place.id}
                  place={{
                    ...place,
                    categoryColor: category?.color ?? place.categoryColor,
                  }}
                />
              );
            })}
            {placesQuery.hasNextPage ? (
              <AppButton
                label={t('explore.loadMore')}
                loading={placesQuery.isFetchingNextPage}
                onPress={() => void placesQuery.fetchNextPage()}
                variant="secondary"
              />
            ) : (
              <StatusCard title={t('explore.endTitle')} description={t('explore.endDescription')} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeading({ description, title }: { description: string; title: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '800' }}>
        {title}
      </Text>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14, lineHeight: 20 }}>
        {description}
      </Text>
    </View>
  );
}
