import { useLocalSearchParams } from 'expo-router';

import { PlaceDetailScreen } from '@/screens/places/place-detail-screen';

export default function PlaceDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const placeId = Array.isArray(id) ? (id[0] ?? null) : (id ?? null);

  return <PlaceDetailScreen placeId={placeId} />;
}
