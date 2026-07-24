import { type Href, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useLocale } from '@/providers/locale-provider';
import { brandColors } from '@/theme';

type AppBackButtonProps = {
  fallback: Href;
};

export function AppBackButton({ fallback }: AppBackButtonProps) {
  const router = useRouter();
  const { t } = useLocale();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback);
  };

  return (
    <Pressable
      accessibilityLabel={t('navigation.back')}
      accessibilityRole="button"
      hitSlop={8}
      onPress={goBack}
      style={({ pressed }) => ({
        alignItems: 'center',
        height: 44,
        justifyContent: 'center',
        opacity: pressed ? 0.55 : 1,
        width: 44,
      })}
    >
      <AppIcon color={brandColors.deepTeal} name="back" size={28} />
    </Pressable>
  );
}
