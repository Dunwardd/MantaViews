import { getSupabaseClient } from '@/services/supabase/client';

type CategoryTranslationRow = {
  locale: 'es' | 'en';
  name: string;
};

type CategoryRow = {
  category_translations: CategoryTranslationRow[];
  color: string;
  id: number;
  slug: string;
  sort_order: number;
};

export type TourismCategory = {
  color: string;
  id: number;
  name: string;
  slug: string;
};

export async function getTourismCategories(locale: 'es' | 'en' = 'es') {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .select('id, slug, color, sort_order, category_translations!inner(locale, name)')
    .eq('is_active', true)
    .eq('category_translations.locale', locale)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data as CategoryRow[]).map<TourismCategory>((category) => ({
    color: category.color,
    id: category.id,
    name: category.category_translations[0]?.name ?? category.slug,
    slug: category.slug,
  }));
}
