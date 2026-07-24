type SuggestionTranslationSource = {
  description: string;
  description_en?: string | null;
  name: string;
  name_en?: string | null;
};

export function buildSuggestionTranslations(
  suggestion: SuggestionTranslationSource,
  placeId: string,
) {
  const englishName = suggestion.name_en?.trim() || suggestion.name;
  const englishDescription = suggestion.description_en?.trim() || suggestion.description;

  return [
    {
      description: suggestion.description,
      locale: 'es',
      name: suggestion.name,
      place_id: placeId,
      short_description: suggestion.description.slice(0, 280),
    },
    {
      description: englishDescription,
      locale: 'en',
      name: englishName,
      place_id: placeId,
      short_description: englishDescription.slice(0, 280),
    },
  ];
}
