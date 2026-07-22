import { useEffect, useRef } from 'react';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import type { TourismMapProps } from '@/components/map/tourism-map-types';
import { useLocale } from '@/providers/locale-provider';
import { brandColors } from '@/theme';

const MANTA_REGION: Region = {
  latitude: -0.9538,
  latitudeDelta: 0.2,
  longitude: -80.7331,
  longitudeDelta: 0.2,
};

export function TourismMap({
  onSelectPlace,
  places,
  routeCoordinates,
  selectedPlaceId,
  userLocation,
}: TourismMapProps) {
  const { t } = useLocale();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (routeCoordinates.length > 1) {
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        animated: true,
        edgePadding: { bottom: 70, left: 50, right: 50, top: 70 },
      });
      return;
    }

    if (userLocation) {
      mapRef.current?.animateToRegion(
        { ...userLocation, latitudeDelta: 0.08, longitudeDelta: 0.08 },
        450,
      );
    }
  }, [routeCoordinates, userLocation]);

  return (
    <MapView
      accessibilityLabel={t('map.label')}
      initialRegion={MANTA_REGION}
      mapPadding={{ bottom: 10, left: 10, right: 10, top: 10 }}
      ref={mapRef}
      showsCompass
      style={{ height: 420, width: '100%' }}
    >
      {places.map((place) => (
        <Marker
          coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          description={t('map.placeDescription')}
          identifier={place.id}
          key={place.id}
          onPress={() => onSelectPlace(place.id)}
          pinColor={place.id === selectedPlaceId ? brandColors.sun : place.categoryColor}
          title={place.name}
        />
      ))}
      {userLocation ? (
        <Marker
          coordinate={userLocation}
          description={t('map.locationPrivacy')}
          identifier="current-user-location"
          pinColor="#2E6CF6"
          title={t('map.userLocation')}
        />
      ) : null}
      {routeCoordinates.length > 1 ? (
        <Polyline
          coordinates={routeCoordinates}
          lineCap="round"
          lineJoin="round"
          strokeColor={brandColors.primary}
          strokeWidth={5}
        />
      ) : null}
    </MapView>
  );
}
