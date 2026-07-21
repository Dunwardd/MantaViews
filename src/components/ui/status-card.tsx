import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { brandColors, colors, spacing } from '@/theme';

type StatusCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  accent?: string;
};

export function StatusCard({
  title,
  description,
  icon,
  accent = brandColors.primary,
}: StatusCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderCurve: 'continuous',
        borderRadius: 20,
        borderWidth: 1,
        boxShadow: '0 8px 24px rgba(3, 79, 85, 0.08)',
        gap: spacing.sm,
        padding: spacing.lg,
      }}
    >
      {icon}
      <View style={{ backgroundColor: accent, borderRadius: 999, height: 4, width: 42 }} />
      <Text selectable style={{ color: colors.label, fontSize: 18, fontWeight: '700' }}>
        {title}
      </Text>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15, lineHeight: 22 }}>
        {description}
      </Text>
    </View>
  );
}
