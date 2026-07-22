import { useState } from 'react';
import { Pressable, Text, type TextInputProps } from 'react-native';

import { AppInput } from '@/components/ui/app-input';
import { useLocale } from '@/providers/locale-provider';
import { brandColors } from '@/theme';

type AuthFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AuthField({ error, label, secureTextEntry, ...props }: AuthFieldProps) {
  const { t } = useLocale();
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
            accessibilityLabel={isVisible ? t('auth.hidePassword') : t('auth.showPassword')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setIsVisible((current) => !current)}
          >
            <Text style={{ color: brandColors.primary, fontSize: 13, fontWeight: '700' }}>
              {isVisible ? t('auth.hide') : t('auth.show')}
            </Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}
