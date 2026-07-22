import assert from 'node:assert/strict';
import test from 'node:test';

import { brandColors, colors, getContrastRatio } from '../../src/theme/colors.ts';

test('los textos principales cumplen contraste WCAG AA', () => {
  assert.ok(getContrastRatio(colors.label, colors.background) >= 4.5);
  assert.ok(getContrastRatio(colors.secondaryLabel, colors.background) >= 4.5);
  assert.ok(getContrastRatio(colors.onPrimary, brandColors.primary) >= 4.5);
  assert.ok(getContrastRatio(colors.error, colors.background) >= 4.5);
});
