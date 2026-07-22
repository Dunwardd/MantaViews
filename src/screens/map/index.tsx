import { useMutation, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Link, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { TourismMap } from '@/components/map/tourism-map';
import { AppButton } from '@/components/ui/app-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { RatingDisplay } from '@/components/ui/rating-display';
import { StatusCard } from '@/components/ui/status-card';
import { useLocale } from '@/providers/locale-provider';
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
import { brandColors, colors, layout, spacing } from '@/theme';
import { MANTA_CENTER } from '@/utils/geo';

type LocationPermissionState =
  'blocked' | 'checking' | 'denied' | 'error' | 'granted' | 'services-disabled' | 'undetermined';

export function MapScreen() {
  const { locale, t } = useLocale();
  const routeProfiles: { label: string; value: RouteProfile }[] = [
    { label: t('map.walking'), value: 'foot-walking' },
    { label: t('map.driving'), value: 'driving-car' },
    { label: t('map.cycling'), value: 'cycling-regular' },
  ];
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<RouteCoordinate | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('checking');
  const [isLocating, setIsLocating] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('foot-walking');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void Location.getForegroundPermissionsAsync()
      .then((permission) => {
        if (permission.granted) setPermissionState('granted');
        else if (!permission.canAskAgain) setPermissionState('blocked');
        else if (permission.status === Location.PermissionStatus.DENIED)
          setPermissionState('denied');
        else setPermissionState('undetermined');
      })
      .catch(() => setPermissionState('error'));
  }, []);

  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories(locale),
    queryKey: ['public', 'categories', locale],
  });
  const catalogQuery = useQuery({
    queryFn: () => searchTourismPlaces({ categoryId: selectedCategoryId, limit: 30, locale }),
    queryKey: ['public', 'map-places', locale, selectedCategoryId],
  });
  const nearbyQuery = useQuery({
    enabled: userLocation !== null,
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

  const sourcePlaces = userLocation ? nearbyQuery.data : catalogQuery.data;
  const places = useMemo(
    () =>
      (sourcePlaces ?? []).filter(
        (place): place is TourismPlace & Required<Pick<TourismPlace, 'latitude' | 'longitude'>> =>
          place.latitude !== undefined && place.longitude !== undefined,
      ),
    [sourcePlaces],
  );
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null;
  const routeOrigin =
    userLocation && isWithinManta(userLocation) ? userLocation : (MANTA_CENTER as RouteCoordinate);

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
  };

  const requestCurrentLocation = async () => {
    setActionError(null);
    setIsLocating(true);

    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          setPermissionState('blocked');
          return;
        }
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (!permission.granted) {
        setPermissionState(permission.canAskAgain ? 'denied' : 'blocked');
        return;
      }

      setPermissionState('granted');
      if (!(await Location.hasServicesEnabledAsync())) {
        setPermissionState('services-disabled');
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 1_000,
      });
      const location =
        lastKnown ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coordinates);
      setSelectedPlaceId(null);
      routeMutation.reset();
    } catch {
      setPermissionState('error');
      setActionError(t('map.locationFetchError'));
    } finally {
      setIsLocating(false);
    }
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

  const placesPending = userLocation ? nearbyQuery.isPending : catalogQuery.isPending;
  const placesError = userLocation ? nearbyQuery.isError : catalogQuery.isError;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.lg,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text selectable style={{ color: colors.label, fontSize: 24, fontWeight: '900' }}>
          {t('map.screenTitle')}
        </Text>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15, lineHeight: 22 }}>
          {t('map.screenDescription')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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
      </View>

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
          }}
        >
          <TourismMap
            onSelectPlace={selectPlace}
            places={mapPlaces}
            routeCoordinates={routeMutation.data?.coordinates ?? []}
            selectedPlaceId={selectedPlaceId}
            userLocation={userLocation}
          />
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

      <LocationPanel
        isLocating={isLocating}
        onOpenSettings={() => void Linking.openSettings()}
        onRequestLocation={() => void requestCurrentLocation()}
        permissionState={permissionState}
        userLocation={userLocation}
      />

      {userLocation && !isWithinManta(userLocation) ? (
        <StatusCard
          accent={brandColors.sun}
          description={t('map.outsideDescription')}
          title={t('map.outsideTitle')}
        />
      ) : null}

      {userLocation && nearbyQuery.isSuccess ? (
        <StatusCard
          description={`${places.length} ${t('map.nearbyFound')}`}
          title={t('map.nearbyUpdated')}
        />
      ) : null}

      {selectedPlace ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.separator,
            borderCurve: 'continuous',
            borderRadius: 22,
            borderWidth: 1,
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <View
              style={{
                backgroundColor: categoryFor(selectedPlace)?.color ?? selectedPlace.categoryColor,
                borderRadius: 999,
                height: 11,
                width: 11,
              }}
            />
            <Text style={{ color: colors.secondaryLabel, fontSize: 12, fontWeight: '800' }}>
              {(categoryFor(selectedPlace)?.name ?? selectedPlace.categorySlug).toUpperCase()}
            </Text>
          </View>
          <Text selectable style={{ color: colors.label, fontSize: 22, fontWeight: '900' }}>
            {selectedPlace.name}
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14, lineHeight: 21 }}>
            {selectedPlace.shortDescription}
          </Text>
          <RatingDisplay value={selectedPlace.averageRating ?? 0} />
          <Text selectable style={{ color: brandColors.primary, fontSize: 13, fontWeight: '700' }}>
            {selectedPlace.address}
          </Text>
          {selectedPlace.distanceMeters !== undefined ? (
            <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13 }}>
              {formatDistance(selectedPlace.distanceMeters)} {t('map.distanceFromYou')}
            </Text>
          ) : null}

          <Text selectable style={{ color: colors.label, fontSize: 15, fontWeight: '800' }}>
            {t('map.routePreview')}
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13, lineHeight: 19 }}>
            {t('map.origin')}:{' '}
            {userLocation && isWithinManta(userLocation)
              ? t('map.currentOrigin')
              : t('map.mantaOrigin')}
            .
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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
          </View>
          <AppButton
            label={t('map.calculate')}
            loading={routeMutation.isPending}
            onPress={calculateRoute}
          />
          {routeMutation.isError ? (
            <FeedbackState
              actionLabel={t('common.retry')}
              description={routeMutation.error.message}
              onAction={calculateRoute}
              title={t('map.routeError')}
              tone="error"
            />
          ) : null}
          {routeMutation.data ? (
            <View
              style={{
                backgroundColor: brandColors.sand,
                borderRadius: 18,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.lg,
                padding: spacing.md,
              }}
            >
              <RouteMetric
                label={t('map.distanceMetric')}
                value={formatDistance(routeMutation.data.distanceMeters)}
              />
              <RouteMetric
                label={t('map.durationMetric')}
                value={formatDuration(routeMutation.data.durationSeconds)}
              />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <View style={{ flexGrow: 1, minWidth: 190 }}>
              <AppButton
                label={t('map.openGoogle')}
                onPress={() =>
                  void openExternalUrl(buildGoogleMapsUrl(selectedPlace, routeProfile))
                }
                variant="secondary"
              />
            </View>
            <View style={{ flexGrow: 1, minWidth: 160 }}>
              <AppButton
                label={t('map.openWaze')}
                onPress={() => void openExternalUrl(buildWazeUrl(selectedPlace))}
                variant="secondary"
              />
            </View>
            <View style={{ flexGrow: 1, minWidth: 160 }}>
              <Link href={`/place/${selectedPlace.id}` as Href} asChild>
                <AppButton label={t('map.openDetails')} variant="ghost" />
              </Link>
            </View>
          </View>
        </View>
      ) : (
        <StatusCard
          description={t('map.destinationDescription')}
          title={t('map.destinationTitle')}
        />
      )}

      {actionError ? (
        <FeedbackState description={actionError} title={t('map.actionError')} tone="error" />
      ) : null}
    </ScrollView>
  );
}

function LocationPanel({
  isLocating,
  onOpenSettings,
  onRequestLocation,
  permissionState,
  userLocation,
}: {
  isLocating: boolean;
  onOpenSettings: () => void;
  onRequestLocation: () => void;
  permissionState: LocationPermissionState;
  userLocation: RouteCoordinate | null;
}) {
  const { t } = useLocale();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderCurve: 'continuous',
        borderRadius: 22,
        borderWidth: 1,
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <Text selectable style={{ color: colors.label, fontSize: 19, fontWeight: '900' }}>
        {t('map.nearYou')}
      </Text>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14, lineHeight: 21 }}>
        {t('map.privacyDescription')}
      </Text>
      <AppButton
        label={userLocation ? t('map.updateLocation') : t('map.useLocation')}
        loading={isLocating}
        onPress={onRequestLocation}
        variant="secondary"
      />
      {permissionState === 'denied' ? (
        <StatusCard
          accent={brandColors.sun}
          description={t('map.permissionDeniedDescription')}
          title={t('map.permissionDeniedTitle')}
        />
      ) : null}
      {permissionState === 'blocked' ? (
        <View style={{ gap: spacing.sm }}>
          <StatusCard
            accent={brandColors.sun}
            description={t('map.permissionBlockedDescription')}
            title={t('map.permissionBlockedTitle')}
          />
          <AppButton label={t('map.openSettings')} onPress={onOpenSettings} variant="ghost" />
        </View>
      ) : null}
      {permissionState === 'services-disabled' ? (
        <StatusCard
          accent={brandColors.sun}
          description={t('map.servicesDisabledDescription')}
          title={t('map.servicesDisabledTitle')}
        />
      ) : null}
      {permissionState === 'error' ? (
        <StatusCard
          accent={colors.error}
          description={t('map.locationUnavailableDescription')}
          title={t('map.locationUnavailableTitle')}
        />
      ) : null}
    </View>
  );
}

function RouteMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, gap: spacing.xs, minWidth: 130 }}>
      <Text selectable style={{ color: brandColors.deepTeal, fontSize: 19, fontWeight: '900' }}>
        {value}
      </Text>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 12 }}>
        {label}
      </Text>
    </View>
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

function isWithinManta(coordinate: RouteCoordinate) {
  return (
    coordinate.latitude >= -1.2 &&
    coordinate.latitude <= -0.8 &&
    coordinate.longitude >= -81 &&
    coordinate.longitude <= -80.5
  );
}

function buildGoogleMapsUrl(place: { latitude: number; longitude: number }, profile: RouteProfile) {
  const travelMode =
    profile === 'driving-car' ? 'driving' : profile === 'cycling-regular' ? 'bicycling' : 'walking';
  return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=${travelMode}`;
}

function buildWazeUrl(place: { latitude: number; longitude: number }) {
  return `https://www.waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`;
}
