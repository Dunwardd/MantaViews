import { Redirect, type Href } from 'expo-router';
import { ScrollView } from 'react-native';

import { LoadingState } from '@/components/ui/feedback-state';
import { useLocale } from '@/providers/locale-provider';
import { colors } from '@/theme';

export default function IndexRoute() {
  const { hasCompletedOnboarding, isHydrated, t } = useLocale();

  if (!isHydrated) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        style={{ backgroundColor: colors.background }}
      >
        <LoadingState label={t('app.preparing')} />
      </ScrollView>
    );
  }

  const destination = (hasCompletedOnboarding ? '/(tabs)' : '/onboarding') as Href;
  return <Redirect href={destination} />;
}
