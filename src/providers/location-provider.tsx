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
  refreshLocation: () => Promise<void>;
  userLocation: RouteCoordinate | null;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: PropsWithChildren) {
  const [userLocation, setUserLocation] = useState<RouteCoordinate | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('checking');
  const [isLocating, setIsLocating] = useState(false);
  const requestedOnStart = useRef(false);

  const refreshLocation = useCallback(async () => {
    setIsLocating(true);

    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setPermissionState(permission.canAskAgain ? 'denied' : 'blocked');
        return;
      }
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

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setPermissionState('granted');
    } catch {
      setPermissionState('error');
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
