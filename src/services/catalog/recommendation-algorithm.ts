export type ScoredRecommendation = {
  categorySlug: string;
  id: string;
  score: number;
};

export function diversifyRecommendations<T extends ScoredRecommendation>(
  recommendations: readonly T[],
  limit: number,
) {
  const safeLimit = Math.max(0, Math.trunc(limit));
  const ranked = [...recommendations].sort(
    (left, right) => right.score - left.score || left.id.localeCompare(right.id),
  );
  const buckets = new Map<string, T[]>();

  for (const recommendation of ranked) {
    const bucket = buckets.get(recommendation.categorySlug) ?? [];
    bucket.push(recommendation);
    buckets.set(recommendation.categorySlug, bucket);
  }

  const result: T[] = [];
  while (result.length < safeLimit) {
    let added = false;
    for (const bucket of buckets.values()) {
      const recommendation = bucket.shift();
      if (!recommendation) continue;
      result.push(recommendation);
      added = true;
      if (result.length === safeLimit) break;
    }
    if (!added) break;
  }

  return result;
}
