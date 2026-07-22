import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PlaceCover } from '@/components/places/place-cover';
import { RatingDisplay } from '@/components/ui/rating-display';
import type { TourismPlace } from '@/services/catalog/place-service';
import { brandColors, colors, spacing } from '@/theme';

type PlaceCardProps = {
  categoryName: string;
  place: TourismPlace;
};

export function PlaceCard({ categoryName, place }: PlaceCardProps) {
  return (
    <Link href={`/place/${place.id}` as Href} asChild>
      <Pressable
        accessibilityHint="Abre la ficha completa del lugar"
        accessibilityLabel={`Ver ${place.name}`}
        accessibilityRole="button"
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderCurve: 'continuous',
          borderRadius: 22,
          borderWidth: 1,
          boxShadow: '0 8px 22px rgba(3, 79, 85, 0.08)',
          opacity: pressed ? 0.82 : 1,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <PlaceCover
          categoryColor={place.categoryColor}
          name={place.name}
          url={place.coverImageUrl}
        />
        <View
          style={{
            backgroundColor: `${place.categoryColor}20`,
            borderBottomColor: `${place.categoryColor}40`,
            borderBottomWidth: 1,
            gap: spacing.md,
            minHeight: 92,
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                backgroundColor: place.categoryColor,
                borderRadius: 999,
                height: 10,
                width: 10,
              }}
            />
            <Text selectable style={{ color: colors.label, fontSize: 12, fontWeight: '800' }}>
              {categoryName.toUpperCase()}
            </Text>
            {place.isFeatured ? (
              <View
                style={{
                  backgroundColor: brandColors.sun,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  selectable
                  style={{ color: brandColors.deepTeal, fontSize: 11, fontWeight: '900' }}
                >
                  DESTACADO
                </Text>
              </View>
            ) : null}
          </View>
          <Text selectable style={{ color: colors.label, fontSize: 20, fontWeight: '800' }}>
            {place.name}
          </Text>
        </View>

        <View style={{ gap: spacing.md, padding: spacing.lg }}>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14, lineHeight: 21 }}>
            {place.shortDescription}
          </Text>
          {place.averageRating !== undefined ? (
            <RatingDisplay count={place.reviewCount ?? 0} value={place.averageRating} />
          ) : null}
          <Text selectable style={{ color: brandColors.primary, fontSize: 13, fontWeight: '700' }}>
            {place.address}
          </Text>
          {place.distanceMeters !== undefined ? (
            <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13 }}>
              {formatDistance(place.distanceMeters)} desde el centro de Manta
            </Text>
          ) : null}
          <Text selectable style={{ color: brandColors.deepTeal, fontSize: 13, fontWeight: '800' }}>
            Ver detalles →
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}
