export const brandColors = {
  primary: '#07696C',
  deepTeal: '#034F55',
  ocean: '#2FA7B0',
  lightOcean: '#8DCDD0',
  sand: '#FAF6EB',
  sun: '#F5A719',
  lime: '#A8B83F',
  ink: '#26383A',
  muted: '#6B7C7E',
  white: '#FFFFFF',
  coral: '#E66A4E',
} as const;

export const colors = {
  background: '#FFFCF6',
  label: brandColors.ink,
  secondaryLabel: brandColors.muted,
  separator: '#DCE5E3',
  surface: brandColors.white,
  surfaceMuted: '#F3F7F5',
  primary: brandColors.primary,
  onPrimary: brandColors.white,
  focusRing: brandColors.ocean,
  overlay: 'rgba(3, 79, 85, 0.48)',
  success: '#18794E',
  successSurface: '#ECFDF3',
  warning: '#9A6700',
  warningSurface: '#FFF8E1',
  error: '#B42318',
  errorSurface: '#FEF3F2',
} as const;

export function getReadableTextColor(backgroundColor: string) {
  const hex = backgroundColor.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return colors.label;

  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const backgroundLuminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const deepTealLuminance = 0.064;
  const whiteContrast = 1.05 / (backgroundLuminance + 0.05);
  const tealContrast =
    (Math.max(backgroundLuminance, deepTealLuminance) + 0.05) /
    (Math.min(backgroundLuminance, deepTealLuminance) + 0.05);

  return tealContrast >= whiteContrast ? brandColors.deepTeal : brandColors.white;
}
