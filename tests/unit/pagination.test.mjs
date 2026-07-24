import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectAllPagesById,
  deduplicatePlacesById,
} from '../../src/services/catalog/pagination.ts';

test('elimina lugares repetidos entre páginas y conserva el primer resultado', () => {
  const firstPage = [
    { id: 'place-1', name: 'Primero' },
    { id: 'place-2', name: 'Segundo' },
  ];
  const secondPage = [
    { id: 'place-2', name: 'Segundo repetido' },
    { id: 'place-3', name: 'Tercero' },
  ];

  assert.deepEqual(deduplicatePlacesById([...firstPage, ...secondPage]), [
    { id: 'place-1', name: 'Primero' },
    { id: 'place-2', name: 'Segundo' },
    { id: 'place-3', name: 'Tercero' },
  ]);
});

test('recorre todas las páginas del catálogo y elimina coincidencias repetidas', async () => {
  const pages = [
    [
      { id: 'place-1' },
      { id: 'place-2' },
    ],
    [
      { id: 'place-2' },
      { id: 'place-3' },
    ],
    [{ id: 'place-4' }],
  ];
  const requestedOffsets = [];

  const result = await collectAllPagesById({
    fetchPage: async (offset) => {
      requestedOffsets.push(offset);
      return pages[offset / 2] ?? [];
    },
    pageSize: 2,
  });

  assert.deepEqual(requestedOffsets, [0, 2, 4]);
  assert.deepEqual(
    result.map((place) => place.id),
    ['place-1', 'place-2', 'place-3', 'place-4'],
  );
});
