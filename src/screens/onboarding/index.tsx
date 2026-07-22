import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { FilterChip } from '@/components/ui/filter-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useLocale } from '@/providers/locale-provider';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function OnboardingScreen() {
  const { completeOnboarding, locale, setLocale, t } = useLocale();

  const finish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.xl,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
        <Image
          accessibilityLabel="Logo de MantaViews"
          contentFit="contain"
          source={require('../../../assets/images/mantaviews-app-icon.png')}
          style={{ borderRadius: 28, height: 132, width: 132 }}
        />
        <Text
          selectable
          style={{ ...typography.display, color: brandColors.deepTeal, textAlign: 'center' }}
        >
          {t('onboarding.title')}
        </Text>
        <Text
          selectable
          style={{
            ...typography.body,
            color: colors.secondaryLabel,
            maxWidth: 620,
            textAlign: 'center',
          }}
        >
          {t('onboarding.subtitle')}
        </Text>
      </View>

      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          justifyContent: 'center',
        }}
      >
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <FeatureCard
          description={t('onboarding.discoverDescription')}
          icon="compass"
          title={t('onboarding.discoverTitle')}
        />
        <FeatureCard
          description={t('onboarding.routeDescription')}
          icon="map"
          title={t('onboarding.routeTitle')}
        />
        <FeatureCard
          description={t('onboarding.communityDescription')}
          icon="star"
          title={t('onboarding.communityTitle')}
        />
      </View>

      <AppButton label={t('onboarding.start')} onPress={finish} />
    </ScrollView>
  );
}

type FeatureCardProps = {
  description: string;
  icon: 'compass' | 'map' | 'star';
  title: string;
};

function FeatureCard({ description, icon, title }: FeatureCardProps) {
  return (
    <SurfaceCard style={{ flexBasis: 220, flexGrow: 1 }}>
      <AppIcon color={brandColors.primary} name={icon} size={28} />
      <Text selectable style={{ ...typography.heading, color: colors.label }}>
        {title}
      </Text>
      <Text selectable style={{ ...typography.body, color: colors.secondaryLabel }}>
        {description}
      </Text>
    </SurfaceCard>
  );
}
