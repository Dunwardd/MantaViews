import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { brandColors, colors, spacing, typography } from '@/theme';

type FeedbackStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
  tone?: 'empty' | 'error';
};

export function FeedbackState({
  actionLabel,
  description,
  onAction,
  title,
  tone = 'empty',
}: FeedbackStateProps) {
  const isError = tone === 'error';
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xl }}
    >
      <AppIcon
        color={isError ? colors.error : brandColors.ocean}
        name={isError ? 'warning' : 'compass'}
        size={30}
      />
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text
          selectable
          style={{ ...typography.heading, color: colors.label, textAlign: 'center' }}
        >
          {title}
        </Text>
        <Text
          selectable
          style={{
            ...typography.body,
            color: colors.secondaryLabel,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </Animated.View>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xl }}
    >
      <ActivityIndicator color={brandColors.primary} size="large" />
      <Text
        accessibilityLiveRegion="polite"
        selectable
        style={{ ...typography.body, color: colors.secondaryLabel }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
