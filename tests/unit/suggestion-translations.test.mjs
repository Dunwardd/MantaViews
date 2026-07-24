import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSuggestionTranslations } from '../../supabase/functions/_shared/suggestion-translations.ts';

const spanishSuggestion = {
  description: 'Descripción suficientemente extensa del lugar turístico.',
  name: 'Lugar sugerido',
};

test('usa la información inglesa proporcionada por el usuario', () => {
  const translations = buildSuggestionTranslations(
    {
      ...spanishSuggestion,
      description_en: 'A sufficiently detailed English tourism description.',
      name_en: 'Suggested place',
    },
    'place-id',
  );

  assert.equal(translations[1].name, 'Suggested place');
  assert.equal(translations[1].description, 'A sufficiently detailed English tourism description.');
});

test('completa cada campo inglés vacío con su equivalente en español', () => {
  const translations = buildSuggestionTranslations(
    { ...spanishSuggestion, description_en: null, name_en: 'English name' },
    'place-id',
  );

  assert.equal(translations[1].name, 'English name');
  assert.equal(translations[1].description, spanishSuggestion.description);
  assert.equal(translations[1].short_description, spanishSuggestion.description.slice(0, 280));
});
