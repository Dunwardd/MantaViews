import { Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { brandColors, colors, spacing, typography } from '@/theme';

type RatingDisplayProps = {
  count?: number;
  value: number;
};

export function RatingDisplay({ count, value }: RatingDisplayProps) {
  const safeValue = Math.max(0, Math.min(value, 5));
  return (
    <View
      accessibilityLabel={`${safeValue.toFixed(1)} de 5 estrellas`}
      style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}
    >
      <AppIcon color={brandColors.sun} filled name="star" size={18} />
      <Text
        selectable
        style={{
          ...typography.caption,
          color: colors.label,
          fontVariant: ['tabular-nums'],
          fontWeight: '800',
        }}
      >
        {safeValue.toFixed(1)}
      </Text>
      {count !== undefined ? (
        <Text
          selectable
          style={{
            ...typography.caption,
            color: colors.secondaryLabel,
            fontVariant: ['tabular-nums'],
          }}
        >
          ({count})
        </Text>
      ) : null}
    </View>
  );
}
