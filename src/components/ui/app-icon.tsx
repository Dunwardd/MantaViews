import { Image } from 'expo-image';
import { Text } from 'react-native';

type AppIconName =
  | 'back'
  | 'compass'
  | 'map'
  | 'heart'
  | 'profile'
  | 'settings'
  | 'star'
  | 'warning'
  | 'refresh'
  | 'search';

type AppIconProps = {
  color: string;
  filled?: boolean;
  name: AppIconName;
  size?: number;
};

const symbols: Record<AppIconName, { sf: string; fallback: string }> = {
  back: { sf: 'chevron.backward', fallback: '‹' },
  compass: { sf: 'safari', fallback: '⌖' },
  map: { sf: 'map', fallback: '◇' },
  heart: { sf: 'heart', fallback: '♡' },
  profile: { sf: 'person.crop.circle', fallback: '○' },
  settings: { sf: 'gearshape', fallback: '⚙' },
  star: { sf: 'star', fallback: '★' },
  warning: { sf: 'exclamationmark.triangle', fallback: '!' },
  refresh: { sf: 'arrow.clockwise', fallback: '↻' },
  search: { sf: 'magnifyingglass', fallback: '⌕' },
};

export function AppIcon({ color, filled = false, name, size = 22 }: AppIconProps) {
  const symbol = symbols[name];

  if (process.env.EXPO_OS === 'ios') {
    const sfName = filled && ['heart', 'star'].includes(name) ? `${symbol.sf}.fill` : symbol.sf;
    return (
      <Image
        accessibilityIgnoresInvertColors
        aria-hidden
        contentFit="contain"
        source={`sf:${sfName}`}
        style={{ height: size, tintColor: color, width: size }}
      />
    );
  }

  return (
    <Text
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ color, fontSize: size, fontWeight: filled ? '900' : '700', lineHeight: size + 2 }}
    >
      {filled && name === 'heart' ? '♥' : filled && name === 'profile' ? '●' : symbol.fallback}
    </Text>
  );
}
