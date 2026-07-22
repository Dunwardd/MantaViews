import { Pressable, Text } from 'react-native';

import {
  brandColors,
  colors,
  getReadableTextColor,
  layout,
  radii,
  spacing,
  typography,
} from '@/theme';

type FilterChipProps = {
  color?: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export function FilterChip({
  color = brandColors.primary,
  label,
  onPress,
  selected,
}: FilterChipProps) {
  const selectedTextColor = getReadableTextColor(color);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: selected ? color : colors.surface,
        borderColor: color,
        borderRadius: radii.pill,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: layout.minimumTouchTarget,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: spacing.base,
      })}
    >
      <Text
        selectable
        style={{
          ...typography.caption,
          color: selected ? selectedTextColor : colors.label,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
