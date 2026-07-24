import * as Location from 'expo-location';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import type { RouteCoordinate } from '@/services/routes/route-service';

export type LocationPermissionState =
  'blocked' | 'checking' | 'denied' | 'error' | 'granted' | 'services-disabled';

type LocationContextValue = {
  isLocating: boolean;
  permissionState: LocationPermissionState;
  refreshLocation: () => Promise<RouteCoordinate | null>;
  userLocation: RouteCoordinate | null;
};

const LocationContext = createContext<LocationContextValue | null>(null);
const MAX_ACCEPTABLE_ACCURACY_METERS = 1_500;

export function LocationProvider({ children }: PropsWithChildren) {
  const [userLocation, setUserLocation] = useState<RouteCoordinate | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('checking');
  const [isLocating, setIsLocating] = useState(false);
  const requestedOnStart = useRef(false);

  const refreshLocation = useCallback(async (): Promise<RouteCoordinate | null> => {
    setIsLocating(true);

    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setUserLocation(null);
        setPermissionState(permission.canAskAgain ? 'denied' : 'blocked');
        return null;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setUserLocation(null);
        setPermissionState('services-disabled');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const accuracy = location.coords.accuracy;
      if (
        typeof accuracy !== 'number' ||
        !Number.isFinite(accuracy) ||
        accuracy > MAX_ACCEPTABLE_ACCURACY_METERS
      ) {
        setUserLocation(null);
        setPermissionState('error');
        return null;
      }

      const coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coordinate);
      setPermissionState('granted');
      return coordinate;
    } catch {
      setUserLocation(null);
      setPermissionState('error');
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    if (requestedOnStart.current) return;
    requestedOnStart.current = true;
    void refreshLocation();
  }, [refreshLocation]);

  const value = useMemo<LocationContextValue>(
    () => ({ isLocating, permissionState, refreshLocation, userLocation }),
    [isLocating, permissionState, refreshLocation, userLocation],
  );

  return <LocationContext value={value}>{children}</LocationContext>;
}

export function useAppLocation() {
  const value = use(LocationContext);
  if (!value) throw new Error('useAppLocation debe usarse dentro de LocationProvider.');
  return value;
}
