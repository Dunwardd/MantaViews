import { useState } from 'react';
import { Pressable, Text, type TextInputProps } from 'react-native';

import { AppInput } from '@/components/ui/app-input';
import { brandColors } from '@/theme';

type AuthFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AuthField({ error, label, secureTextEntry, ...props }: AuthFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <AppInput
      {...props}
      error={error}
      label={label}
      secureTextEntry={isPassword && !isVisible}
      rightAccessory={
        isPassword ? (
          <Pressable
            accessibilityLabel={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsVisible((current) => !current)}
          >
            <Text style={{ color: brandColors.primary, fontSize: 13, fontWeight: '700' }}>
              {isVisible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}
