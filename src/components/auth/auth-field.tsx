import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { brandColors, colors, spacing } from '@/theme';

type AuthFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AuthField({ error, label, secureTextEntry, ...props }: AuthFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ color: colors.label, fontSize: 14, fontWeight: '700' }}>
        {label}
      </Text>
      <View
        style={{
          alignItems: 'center',
          borderColor: error ? '#B42318' : colors.separator,
          borderCurve: 'continuous',
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          {...props}
          placeholderTextColor={brandColors.muted}
          secureTextEntry={isPassword && !isVisible}
          style={{ color: colors.label, flex: 1, fontSize: 16, minHeight: 50 }}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsVisible((current) => !current)}
          >
            <Text style={{ color: brandColors.primary, fontSize: 13, fontWeight: '700' }}>
              {isVisible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text selectable style={{ color: '#B42318', fontSize: 13 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
