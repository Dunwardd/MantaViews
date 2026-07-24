import assert from 'node:assert/strict';
import test from 'node:test';

import { isWithinManta, MANTA_CENTER } from '../../src/utils/geo.ts';

test('reconoce el centro y los límites aproximados de Manta', () => {
  assert.equal(isWithinManta(MANTA_CENTER), true);
  assert.equal(isWithinManta({ latitude: -0.8, longitude: -80.5 }), true);
  assert.equal(isWithinManta({ latitude: -1.2, longitude: -81 }), true);
});

test('evita que una ubicación exterior desplace el mapa turístico', () => {
  assert.equal(isWithinManta({ latitude: -2.1709, longitude: -79.9224 }), false);
  assert.equal(isWithinManta({ latitude: -0.1807, longitude: -78.4678 }), false);
});
