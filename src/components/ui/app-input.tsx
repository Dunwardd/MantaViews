import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, layout, radii, spacing, typography } from '@/theme';

type AppInputProps = TextInputProps & {
  error?: string;
  label: string;
  rightAccessory?: ReactNode;
};

export function AppInput({ error, label, rightAccessory, style, ...props }: AppInputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ ...typography.caption, color: colors.label, fontWeight: '700' }}>
        {label}
      </Text>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderColor: error ? colors.error : colors.separator,
          borderCurve: 'continuous',
          borderRadius: radii.md,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: layout.minimumTouchTarget,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          {...props}
          placeholderTextColor={colors.secondaryLabel}
          style={[{ ...typography.body, color: colors.label, flex: 1, minHeight: 50 }, style]}
        />
        {rightAccessory}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{ ...typography.caption, color: colors.error }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
