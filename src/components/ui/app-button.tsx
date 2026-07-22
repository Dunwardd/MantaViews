import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { brandColors, colors, layout, radii, spacing, typography } from '@/theme';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon?: ReactNode;
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function AppButton({
  disabled,
  icon,
  label,
  loading = false,
  variant = 'primary',
  ...props
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const palette = {
    primary: {
      background: brandColors.primary,
      border: brandColors.primary,
      text: colors.onPrimary,
    },
    secondary: {
      background: colors.surface,
      border: brandColors.primary,
      text: brandColors.primary,
    },
    ghost: { background: 'transparent', border: 'transparent', text: brandColors.primary },
    danger: { background: colors.error, border: colors.error, text: brandColors.white },
  }[variant];

  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      {...props}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: palette.background,
        borderColor: palette.border,
        borderCurve: 'continuous',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        minHeight: layout.minimumTouchTarget,
        opacity: isDisabled ? 0.5 : pressed ? 0.76 : 1,
        paddingHorizontal: spacing.base,
        transform: [{ scale: pressed && !isDisabled ? 0.99 : 1 }],
      })}
    >
      {loading ? <ActivityIndicator color={palette.text} /> : icon}
      <Text selectable style={{ ...typography.bodyStrong, color: palette.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
