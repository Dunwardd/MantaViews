import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { brandColors, colors } from '@/theme';

type AppAvatarProps = {
  label: string;
  size?: number;
  uri?: string | null;
};

export function AppAvatar({ label, size = 48, uri }: AppAvatarProps) {
  const initials =
    label
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'MV';

  if (uri) {
    return (
      <Image
        accessibilityLabel={`Avatar de ${label}`}
        contentFit="cover"
        source={{ uri }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`Avatar de ${label}`}
      style={{
        alignItems: 'center',
        backgroundColor: brandColors.lightOcean,
        borderColor: colors.surface,
        borderRadius: size / 2,
        borderWidth: 2,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <Text style={{ color: brandColors.deepTeal, fontSize: size * 0.34, fontWeight: '900' }}>
        {initials}
      </Text>
    </View>
  );
}
