import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { useLocale } from '@/providers/locale-provider';
import { colors, layout, spacing, typography } from '@/theme';

type State = { hasError: boolean };

export class GlobalErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep the fallback free of sensitive exception details. A telemetry provider can be added later.
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return <GlobalErrorFallback onRetry={this.retry} />;
    return this.props.children;
  }
}

function GlobalErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useLocale();

  return (
    <ScrollView
      accessibilityRole="alert"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignItems: 'center',
        flexGrow: 1,
        gap: spacing.lg,
        justifyContent: 'center',
        padding: spacing.xl,
      }}
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ alignItems: 'center', gap: spacing.md, maxWidth: layout.formMaxWidth }}>
        <AppIcon color={colors.error} name="warning" size={36} />
        <Text selectable style={{ ...typography.title, color: colors.label, textAlign: 'center' }}>
          {t('error.title')}
        </Text>
        <Text
          selectable
          style={{ ...typography.body, color: colors.secondaryLabel, textAlign: 'center' }}
        >
          {t('error.description')}
        </Text>
        <AppButton label={t('error.retry')} onPress={onRetry} />
      </View>
    </ScrollView>
  );
}
