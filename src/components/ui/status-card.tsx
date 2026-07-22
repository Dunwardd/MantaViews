import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { SurfaceCard } from '@/components/ui/surface-card';
import { brandColors, colors, typography } from '@/theme';

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
    <SurfaceCard>
      {icon}
      <View style={{ backgroundColor: accent, borderRadius: 999, height: 4, width: 42 }} />
      <Text selectable style={{ ...typography.heading, color: colors.label, fontSize: 18 }}>
        {title}
      </Text>
      <Text selectable style={{ ...typography.body, color: colors.secondaryLabel, fontSize: 15 }}>
        {description}
      </Text>
    </SurfaceCard>
  );
}
