import { ScrollView, Text, View } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
import { StatusCard } from '@/components/ui/status-card';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function PreferencesScreen() {
  const { locale, setLocale, t } = useLocale();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.lg,
        maxWidth: layout.formMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ ...typography.heading, color: colors.label }}>
          {t('preferences.language')}
        </Text>
        <Text selectable style={{ ...typography.body, color: colors.secondaryLabel }}>
          {t('preferences.description')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <FilterChip
          label={t('language.spanish')}
          onPress={() => setLocale('es')}
          selected={locale === 'es'}
        />
        <FilterChip
          color={brandColors.ocean}
          label={t('language.english')}
          onPress={() => setLocale('en')}
          selected={locale === 'en'}
        />
      </View>

      <StatusCard
        accent={brandColors.lime}
        title={t('preferences.readyTitle')}
        description={t('preferences.readyDescription')}
      />
    </ScrollView>
  );
}
