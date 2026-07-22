import assert from 'node:assert/strict';
import test from 'node:test';

import { diversifyRecommendations } from '../../src/services/catalog/recommendation-algorithm.ts';

const candidates = [
  { categorySlug: 'playas', id: 'playa-1', score: 10 },
  { categorySlug: 'playas', id: 'playa-2', score: 9 },
  { categorySlug: 'museos', id: 'museo-1', score: 8 },
  { categorySlug: 'restaurantes', id: 'restaurante-1', score: 7 },
];

test('prioriza diversidad antes de repetir categoría', () => {
  const result = diversifyRecommendations(candidates, 3);
  assert.deepEqual(
    result.map((item) => item.id),
    ['playa-1', 'museo-1', 'restaurante-1'],
  );
});

test('mantiene orden determinista y respeta el límite', () => {
  const result = diversifyRecommendations([...candidates].reverse(), 4);
  assert.deepEqual(
    result.map((item) => item.id),
    ['playa-1', 'museo-1', 'restaurante-1', 'playa-2'],
  );
  assert.equal(diversifyRecommendations(candidates, 0).length, 0);
});
