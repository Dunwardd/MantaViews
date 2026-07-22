import type { RouteCoordinate } from '@/services/routes/route-service';

export type TourismMapPlace = RouteCoordinate & {
  categoryColor: string;
  id: string;
  name: string;
};

export type TourismMapProps = {
  onSelectPlace: (placeId: string) => void;
  places: TourismMapPlace[];
  routeCoordinates: RouteCoordinate[];
  selectedPlaceId: string | null;
  userLocation: RouteCoordinate | null;
};
