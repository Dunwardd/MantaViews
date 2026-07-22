export { brandColors, colors, getContrastRatio, getReadableTextColor } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '900' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '800' as const },
} as const;

export const shadows = {
  card: '0 8px 24px rgba(3, 79, 85, 0.08)',
  floating: '0 14px 34px rgba(3, 79, 85, 0.14)',
} as const;

export const layout = {
  contentMaxWidth: 960,
  formMaxWidth: 480,
  minimumTouchTarget: 48,
} as const;
