const EARTH_RADIUS_METERS = 6_371_000;

export const MANTA_CENTER = {
  latitude: -0.9538,
  longitude: -80.7331,
} as const;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function isWithinManta(coordinate: Coordinates) {
  return (
    coordinate.latitude >= -1.2 &&
    coordinate.latitude <= -0.8 &&
    coordinate.longitude >= -81 &&
    coordinate.longitude <= -80.5
  );
}

export function distanceInMeters(from: Coordinates, to: Coordinates) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}
