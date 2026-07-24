import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors } from '@/theme';

type AppAvatarProps = {
  label: string;
  size?: number;
  uri?: string | null;
};

export function AppAvatar({ label, size = 48, uri }: AppAvatarProps) {
  const { t } = useLocale();
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (uri && failedUri !== uri) {
    return (
      <Image
        accessibilityLabel={`${t('avatar.label')} ${label}`}
        contentFit="cover"
        onError={() => setFailedUri(uri)}
        source={{ uri }}
        style={{
          borderColor: colors.surface,
          borderRadius: size / 2,
          borderWidth: 2,
          height: size,
          width: size,
        }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${t('avatar.label')} ${label}`}
      accessibilityRole="image"
      style={{
        alignItems: 'center',
        backgroundColor: brandColors.lightOcean,
        borderColor: colors.surface,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}
    >
      <View
        style={{
          backgroundColor: brandColors.deepTeal,
          borderRadius: size * 0.14,
          height: size * 0.28,
          width: size * 0.28,
        }}
      />
      <View
        style={{
          backgroundColor: brandColors.deepTeal,
          borderTopLeftRadius: size * 0.3,
          borderTopRightRadius: size * 0.3,
          bottom: -size * 0.12,
          height: size * 0.42,
          position: 'absolute',
          width: size * 0.7,
        }}
      />
    </View>
  );
}
