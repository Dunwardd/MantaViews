import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PlaceCover } from '@/components/places/place-cover';
import { RatingDisplay } from '@/components/ui/rating-display';
import type { TourismRecommendation } from '@/services/catalog/place-service';
import { brandColors, colors, spacing } from '@/theme';

type RecommendationCardProps = {
  categoryColor: string;
  categoryName: string;
  recommendation: TourismRecommendation;
};

export function RecommendationCard({
  categoryColor,
  categoryName,
  recommendation,
}: RecommendationCardProps) {
  return (
    <Link href={`/place/${recommendation.id}` as Href} asChild>
      <Pressable
        accessibilityHint="Abre la ficha completa del lugar recomendado"
        accessibilityLabel={`Ver recomendación: ${recommendation.name}`}
        accessibilityRole="button"
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderRadius: 22,
          borderWidth: 1,
          minWidth: 270,
          opacity: pressed ? 0.82 : 1,
          overflow: 'hidden',
          width: 300,
        })}
      >
        <PlaceCover
          categoryColor={categoryColor}
          height={148}
          name={recommendation.name}
          url={recommendation.coverImageUrl}
        />
        <View style={{ gap: spacing.sm, padding: spacing.base }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
            <View
              style={{ backgroundColor: categoryColor, borderRadius: 999, height: 9, width: 9 }}
            />
            <Text style={{ color: colors.secondaryLabel, fontSize: 11, fontWeight: '800' }}>
              {categoryName.toUpperCase()}
            </Text>
          </View>
          <Text numberOfLines={2} style={{ color: colors.label, fontSize: 19, fontWeight: '900' }}>
            {recommendation.name}
          </Text>
          <Text
            numberOfLines={2}
            style={{ color: colors.secondaryLabel, fontSize: 13, lineHeight: 19 }}
          >
            {recommendation.shortDescription}
          </Text>
          <RatingDisplay value={recommendation.averageRating ?? 0} />
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: brandColors.sand,
              borderRadius: 999,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={{ color: brandColors.deepTeal, fontSize: 12, fontWeight: '800' }}>
              {recommendation.recommendationReason}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
