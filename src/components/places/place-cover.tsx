import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors, spacing } from '@/theme';

type PlaceCoverProps = {
  altText?: string | null;
  categoryColor: string;
  height?: number;
  name: string;
  url?: string | null;
};

export function PlaceCover({ altText, categoryColor, height = 176, name, url }: PlaceCoverProps) {
  const { t } = useLocale();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url !== failedUrl) setFailedUrl(null);
  }, [failedUrl, url]);

  if (url && url !== failedUrl) {
    return (
      <Image
        accessibilityLabel={altText || `${t('places.photo')} ${name}`}
        contentFit="cover"
        onError={() => setFailedUrl(url)}
        recyclingKey={url}
        source={{ uri: url }}
        style={{ backgroundColor: `${categoryColor}20`, height, width: '100%' }}
        transition={180}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${t('places.illustration')} ${name}`}
      accessibilityRole="image"
      style={{
        alignItems: 'center',
        backgroundColor: `${categoryColor}20`,
        gap: spacing.sm,
        height,
        justifyContent: 'center',
        padding: spacing.lg,
        width: '100%',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 999,
          height: 58,
          justifyContent: 'center',
          width: 58,
        }}
      >
        <AppIcon color={categoryColor || brandColors.primary} name="compass" size={30} />
      </View>
      <Text
        numberOfLines={1}
        style={{ color: brandColors.deepTeal, fontSize: 13, fontWeight: '800' }}
      >
        {t('places.discoverManta')}
      </Text>
    </View>
  );
}
