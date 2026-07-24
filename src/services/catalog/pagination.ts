export function deduplicatePlacesById<T extends { id: string }>(places: T[]) {
  const uniquePlaces = new Map<string, T>();

  for (const place of places) {
    if (!uniquePlaces.has(place.id)) uniquePlaces.set(place.id, place);
  }

  return [...uniquePlaces.values()];
}

export async function collectAllPagesById<T extends { id: string }>({
  fetchPage,
  maxPages = 20,
  pageSize,
}: {
  fetchPage: (offset: number, limit: number) => Promise<T[]>;
  maxPages?: number;
  pageSize: number;
}) {
  const collected: T[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const results = await fetchPage(page * pageSize, pageSize);
    collected.push(...results);
    if (results.length < pageSize) break;
  }

  return deduplicatePlacesById(collected);
}
