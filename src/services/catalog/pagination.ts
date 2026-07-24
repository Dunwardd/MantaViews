export function deduplicatePlacesById<T extends { id: string }>(places: T[]) {
  const uniquePlaces = new Map<string, T>();

  for (const place of places) {
    if (!uniquePlaces.has(place.id)) uniquePlaces.set(place.id, place);
  }

  return [...uniquePlaces.values()];
}
