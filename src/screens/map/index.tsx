import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { TourismMap } from '@/components/map/tourism-map';
import { PlaceCover } from '@/components/places/place-cover';
import { AppButton } from '@/components/ui/app-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { RatingDisplay } from '@/components/ui/rating-display';
import { useLocale } from '@/providers/locale-provider';
import { useAppLocation } from '@/providers/location-provider';
import { getTourismCategories } from '@/services/catalog/category-service';
import {
  getNearbyTourismPlaces,
  searchTourismPlaces,
  type TourismPlace,
} from '@/services/catalog/place-service';
import {
  getRoutePreview,
  type RouteCoordinate,
  type RouteProfile,
} from '@/services/routes/route-service';
import { buildGoogleMapsDirectionsUrl } from '@/services/routes/external-navigation';
import { brandColors, colors, layout, shadows, spacing } from '@/theme';
import { isWithinManta, MANTA_CENTER } from '@/utils/geo';

export function MapScreen() {
  const { locale, t } = useLocale();
  const { height: viewportHeight } = useWindowDimensions();
  const { permissionState, refreshLocation, userLocation } = useAppLocation();
  const routeProfiles: { label: string; value: RouteProfile }[] = [
    { label: t('map.walking'), value: 'foot-walking' },
    { label: t('map.driving'), value: 'driving-car' },
    { label: t('map.cycling'), value: 'cycling-regular' },
  ];
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('foot-walking');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpeningGoogleMaps, setIsOpeningGoogleMaps] = useState(false);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const mapHeight = Math.max(500, Math.min(640, viewportHeight - 210));

  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories(locale),
    queryKey: ['public', 'categories', locale],
  });
  const catalogQuery = useQuery({
    queryFn: () => searchTourismPlaces({ categoryId: selectedCategoryId, limit: 30, locale }),
    queryKey: ['public', 'map-places', locale, selectedCategoryId],
  });
  const isUserWithinManta = userLocation !== null && isWithinManta(userLocation);
  const nearbyQuery = useQuery({
    enabled: isUserWithinManta,
    queryFn: () =>
      getNearbyTourismPlaces({
        categoryId: selectedCategoryId,
        latitude: (userLocation as RouteCoordinate).latitude,
        locale,
        longitude: (userLocation as RouteCoordinate).longitude,
        radiusMeters: 15_000,
      }),
    queryKey: [
      'public',
      'nearby-places',
      locale,
      selectedCategoryId,
      userLocation?.latitude,
      userLocation?.longitude,
    ],
  });
  const routeMutation = useMutation({ mutationFn: getRoutePreview });

  const sourcePlaces = isUserWithinManta ? nearbyQuery.data : catalogQuery.data;
  const places = useMemo(
    () =>
      (sourcePlaces ?? []).filter(
        (place): place is TourismPlace & Required<Pick<TourismPlace, 'latitude' | 'longitude'>> =>
          place.latitude !== undefined && place.longitude !== undefined,
      ),
    [sourcePlaces],
  );
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null;
  const routeOrigin = isUserWithinManta
    ? userLocation
    : (MANTA_CENTER as RouteCoordinate);

  const categoryFor = (place: TourismPlace) =>
    categoriesQuery.data?.find(
      (category) => category.id === place.categoryId || category.slug === place.categorySlug,
    );
  const mapPlaces = places.map((place) => ({
    categoryColor: categoryFor(place)?.color ?? place.categoryColor,
    id: place.id,
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
  }));

  const selectPlace = (placeId: string) => {
    setSelectedPlaceId(placeId);
    routeMutation.reset();
    setActionError(null);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, mapOffsetY - spacing.sm) });
    });
  };

  const calculateRoute = () => {
    if (!selectedPlace) return;
    routeMutation.mutate({
      destination: {
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
      origin: routeOrigin,
      profile: routeProfile,
    });
  };

  const openExternalUrl = async (url: string) => {
    setActionError(null);
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsafe protocol');
      await Linking.openURL(parsed.toString());
    } catch {
      setActionError(t('map.navigationOpenError'));
    }
  };

  const openGoogleMaps = async () => {
    if (!selectedPlace || isOpeningGoogleMaps) return;
    setIsOpeningGoogleMaps(true);
    try {
      const currentOrigin = await refreshLocation();
      await openExternalUrl(
        buildGoogleMapsDirectionsUrl({
          destination: selectedPlace,
          origin: currentOrigin,
          profile: routeProfile,
        }),
      );
    } finally {
      setIsOpeningGoogleMaps(false);
    }
  };

  const placesPending = isUserWithinManta ? nearbyQuery.isPending : catalogQuery.isPending;
  const placesError = isUserWithinManta ? nearbyQuery.isError : catalogQuery.isError;
  const locationIssue =
    permissionState === 'blocked'
      ? t('map.permissionBlockedDescription')
      : permissionState === 'denied'
        ? t('map.permissionDeniedDescription')
        : permissionState === 'services-disabled'
          ? t('map.servicesDisabledDescription')
          : permissionState === 'error'
            ? t('map.locationUnavailableDescription')
            : null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.md,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.md,
        width: '100%',
      }}
      ref={scrollRef}
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: colors.label, fontSize: 18, fontWeight: '900' }}>
          {t('map.screenTitle')}
        </Text>
        <Text
          numberOfLines={1}
          selectable
          style={{ color: colors.secondaryLabel, fontSize: 12, lineHeight: 17 }}
        >
          {t('map.screenDescription')}
        </Text>
      </View>

      {locationIssue ? (
        <View
          onLayout={(event) => setMapOffsetY(event.nativeEvent.layout.y)}
          style={{
            alignItems: 'center',
            backgroundColor: colors.warningSurface,
            borderRadius: 14,
            flexDirection: 'row',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Text
            numberOfLines={2}
            selectable
            style={{ color: colors.warning, flex: 1, fontSize: 12, lineHeight: 17 }}
          >
            {locationIssue}
          </Text>
          {permissionState === 'blocked' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: spacing.sm })}
            >
              <Text style={{ color: brandColors.primary, fontSize: 12, fontWeight: '900' }}>
                {t('map.openSettings')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          label={t('explore.all')}
          onPress={() => {
            setSelectedCategoryId(null);
            setSelectedPlaceId(null);
            routeMutation.reset();
          }}
          selected={selectedCategoryId === null}
        />
        {categoriesQuery.data?.map((category) => (
          <FilterChip
            color={category.color}
            key={category.id}
            label={category.name}
            onPress={() => {
              setSelectedCategoryId(category.id);
              setSelectedPlaceId(null);
              routeMutation.reset();
            }}
            selected={selectedCategoryId === category.id}
          />
        ))}
      </ScrollView>

      {placesPending ? (
        <LoadingState label={t('map.placesLoading')} />
      ) : placesError ? (
        <FeedbackState
          actionLabel={t('common.retry')}
          description={t('map.unavailableDescription')}
          onAction={() => void (userLocation ? nearbyQuery.refetch() : catalogQuery.refetch())}
          title={t('map.unavailableTitle')}
          tone="error"
        />
      ) : (
        <View
          style={{
            borderColor: colors.separator,
            borderCurve: 'continuous',
            borderRadius: 24,
            borderWidth: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <TourismMap
            height={mapHeight}
            onSelectPlace={selectPlace}
            places={mapPlaces}
            routeCoordinates={routeMutation.data?.coordinates ?? []}
            selectedPlaceId={selectedPlaceId}
            userLocation={isUserWithinManta ? userLocation : null}
          />

          {selectedPlace ? (
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                borderColor: colors.separator,
                borderCurve: 'continuous',
                borderRadius: 18,
                borderWidth: 1,
                boxShadow: shadows.floating,
                gap: spacing.sm,
                left: spacing.md,
                padding: spacing.md,
                position: 'absolute',
                right: spacing.md,
                top: spacing.md,
                zIndex: 1000,
              }}
            >
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                <View
                  style={{
                    borderRadius: 12,
                    height: 64,
                    overflow: 'hidden',
                    width: 86,
                  }}
                >
                  <PlaceCover
                    categoryColor={
                      categoryFor(selectedPlace)?.color ?? selectedPlace.categoryColor
                    }
                    height={64}
                    name={selectedPlace.name}
                    url={selectedPlace.coverImageUrl}
                  />
                </View>
                <View
                  style={{
                    backgroundColor:
                      categoryFor(selectedPlace)?.color ?? selectedPlace.categoryColor,
                    borderRadius: 999,
                    height: 10,
                    width: 10,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    selectable
                    style={{ color: colors.label, fontSize: 17, fontWeight: '900' }}
                  >
                    {selectedPlace.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    selectable
                    style={{ color: colors.secondaryLabel, fontSize: 11, fontWeight: '800' }}
                  >
                    {(categoryFor(selectedPlace)?.name ?? selectedPlace.categorySlug).toUpperCase()}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={t('common.close')}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setSelectedPlaceId(null);
                    routeMutation.reset();
                  }}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    height: 36,
                    justifyContent: 'center',
                    opacity: pressed ? 0.55 : 1,
                    width: 36,
                  })}
                >
                  <Text style={{ color: colors.secondaryLabel, fontSize: 24, lineHeight: 26 }}>
                    ×
                  </Text>
                </Pressable>
              </View>

              <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                <RatingDisplay value={selectedPlace.averageRating ?? 0} />
                <Text
                  numberOfLines={1}
                  selectable
                  style={{ color: colors.secondaryLabel, flex: 1, fontSize: 12 }}
                >
                  {selectedPlace.address}
                </Text>
                {routeMutation.data ? (
                  <Text
                    selectable
                    style={{ color: brandColors.deepTeal, fontSize: 12, fontWeight: '900' }}
                  >
                    {formatDistance(routeMutation.data.distanceMeters)} ·{' '}
                    {formatDuration(routeMutation.data.durationSeconds)}
                  </Text>
                ) : null}
              </View>

              <ScrollView
                contentContainerStyle={{ gap: spacing.sm }}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {routeProfiles.map((profile) => (
                  <FilterChip
                    key={profile.value}
                    label={profile.label}
                    onPress={() => {
                      setRouteProfile(profile.value);
                      routeMutation.reset();
                    }}
                    selected={routeProfile === profile.value}
                  />
                ))}
              </ScrollView>

              <ScrollView
                contentContainerStyle={{ gap: spacing.sm }}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ width: 150 }}>
                  <AppButton
                    label={t('map.calculate')}
                    loading={routeMutation.isPending}
                    onPress={calculateRoute}
                  />
                </View>
                <View style={{ width: 170 }}>
                  <AppButton
                    label={t('map.openGoogle')}
                    loading={isOpeningGoogleMaps}
                    onPress={() => void openGoogleMaps()}
                    variant="secondary"
                  />
                </View>
                <View style={{ width: 130 }}>
                  <AppButton
                    label={t('map.openWaze')}
                    onPress={() => void openExternalUrl(buildWazeUrl(selectedPlace))}
                    variant="secondary"
                  />
                </View>
                <View style={{ width: 150 }}>
                  <Link href={`/place/${selectedPlace.id}` as Href} asChild>
                    <AppButton label={t('map.openDetails')} variant="ghost" />
                  </Link>
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}

      {places.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ gap: spacing.sm }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {places.map((place) => (
            <Pressable
              accessibilityLabel={`${t('map.selectOnMap')}: ${place.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPlaceId === place.id }}
              key={place.id}
              onPress={() => selectPlace(place.id)}
              style={({ pressed }) => ({
                backgroundColor:
                  selectedPlaceId === place.id ? brandColors.lightOcean : colors.surface,
                borderColor: selectedPlaceId === place.id ? brandColors.primary : colors.separator,
                borderRadius: 999,
                borderWidth: 1,
                opacity: pressed ? 0.7 : 1,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              })}
            >
              <Text style={{ color: colors.label, fontSize: 13, fontWeight: '800' }}>
                {place.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {userLocation && !isWithinManta(userLocation) ? (
        <Text selectable style={{ color: colors.warning, fontSize: 12 }}>
          {t('map.outsideDescription')}
        </Text>
      ) : null}

      {routeMutation.isError ? (
        <FeedbackState
          actionLabel={t('common.retry')}
          description={routeMutation.error.message}
          onAction={calculateRoute}
          title={t('map.routeError')}
          tone="error"
        />
      ) : null}

      {actionError ? (
        <FeedbackState description={actionError} title={t('map.actionError')} tone="error" />
      ) : null}
    </ScrollView>
  );
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1_000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function buildWazeUrl(place: { latitude: number; longitude: number }) {
  return `https://www.waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`;
}
