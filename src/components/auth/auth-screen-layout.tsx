import { Image } from 'expo-image';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';

import { brandColors, colors, spacing } from '@/theme';

type AuthScreenLayoutProps = PropsWithChildren<{
  footer?: ReactNode;
  subtitle: string;
  title: string;
}>;

export function AuthScreenLayout({ children, footer, subtitle, title }: AuthScreenLayoutProps) {
  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ alignItems: 'center', gap: spacing.lg, padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', gap: spacing.sm, maxWidth: 480, width: '100%' }}>
          <Image
            source={require('../../../assets/images/brand-logo.jpeg')}
            contentFit="contain"
            style={{ borderRadius: 24, height: 116, width: 116 }}
          />
          <Text
            selectable
            style={{
              color: brandColors.deepTeal,
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{
              color: colors.secondaryLabel,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.separator,
            borderCurve: 'continuous',
            borderRadius: 24,
            borderWidth: 1,
            boxShadow: '0 12px 32px rgba(3, 79, 85, 0.10)',
            gap: spacing.md,
            maxWidth: 480,
            padding: spacing.lg,
            width: '100%',
          }}
        >
          {children}
        </View>

        {footer ? <View style={{ maxWidth: 480, width: '100%' }}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
