import { ActivityIndicator, Pressable, Text } from 'react-native';

import { brandColors, colors } from '@/theme';

type AuthButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({
  disabled,
  label,
  loading,
  onPress,
  variant = 'primary',
}: AuthButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: isPrimary ? brandColors.primary : colors.surface,
        borderColor: isPrimary ? brandColors.primary : colors.separator,
        borderCurve: 'continuous',
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 52,
        opacity: isDisabled ? 0.55 : pressed ? 0.78 : 1,
        paddingHorizontal: 18,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? brandColors.white : brandColors.primary} />
      ) : (
        <Text
          style={{
            color: isPrimary ? brandColors.white : brandColors.deepTeal,
            fontSize: 16,
            fontWeight: '800',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
