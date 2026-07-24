import type { RouteCoordinate, RouteProfile } from '@/services/routes/route-service';

type PlaceCoordinate = Pick<RouteCoordinate, 'latitude' | 'longitude'>;

export function buildGoogleMapsDestinationUrl(destination: PlaceCoordinate) {
  return `https://www.google.com/maps/search/?api=1&query=${formatCoordinate(destination)}`;
}

export function buildGoogleMapsDirectionsUrl({
  destination,
  origin,
  profile,
}: {
  destination: PlaceCoordinate;
  origin: RouteCoordinate | null;
  profile?: RouteProfile;
}) {
  if (!origin) return buildGoogleMapsDestinationUrl(destination);

  const travelMode =
    profile === 'cycling-regular'
      ? 'bicycling'
      : profile === 'foot-walking'
        ? 'walking'
        : 'driving';

  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&origin=${formatCoordinate(origin)}` +
    `&destination=${formatCoordinate(destination)}` +
    `&travelmode=${travelMode}&dir_action=navigate`
  );
}

function formatCoordinate(coordinate: PlaceCoordinate) {
  return `${coordinate.latitude},${coordinate.longitude}`;
}
