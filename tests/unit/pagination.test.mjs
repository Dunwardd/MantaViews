import assert from 'node:assert/strict';
import test from 'node:test';

import { deduplicatePlacesById } from '../../src/services/catalog/pagination.ts';

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
