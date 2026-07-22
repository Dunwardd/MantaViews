import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme';

type SurfaceCardProps = PropsWithChildren<
  ViewProps & {
    padded?: boolean;
  }
>;

export function SurfaceCard({ children, padded = true, style, ...props }: SurfaceCardProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderCurve: 'continuous',
          borderRadius: radii.lg,
          borderWidth: 1,
          boxShadow: shadows.card,
          gap: spacing.sm,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
