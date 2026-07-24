import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getTourismCategories } from '@/services/catalog/category-service';
import { getUserInterests, replaceUserInterests } from '@/services/community/community-service';
import { getCurrentProfile, updateCurrentProfile } from '@/services/profiles/profile-service';
import {
  getPublicAvatarUrl,
  removeOwnAvatar,
  uploadAvatar,
} from '@/services/storage/image-service';
import { pickCompressedImage, type PreparedImage } from '@/services/storage/media-picker';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function AccountSettingsScreen() {
  const { user } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [avatar, setAvatar] = useState<PreparedImage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const profileQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getCurrentProfile(user!.id),
    queryKey: ['private', 'profile', user?.id],
  });
  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories(locale),
    queryKey: ['public', 'categories', locale],
  });
  const interestsQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getUserInterests(user!.id),
    queryKey: ['private', 'interests', user?.id],
  });

  useEffect(() => {
    if (profileQuery.data) setDisplayName(profileQuery.data.display_name);
  }, [profileQuery.data]);
  useEffect(() => {
    if (interestsQuery.data) {
      setSelectedInterests(interestsQuery.data.map((interest) => interest.category_id));
    }
  }, [interestsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t('account.loginRequired'));
      const cleanName = displayName.trim();
      if (cleanName.length < 2 || cleanName.length > 80) {
        throw new Error(t('account.nameLength'));
      }
      const previousAvatarPath = profileQuery.data?.avatar_path ?? null;
      const uploadedAvatarPath = avatar
        ? await uploadAvatar({ ...avatar, userId: user.id })
        : null;
      const avatarPath = uploadedAvatarPath ?? previousAvatarPath;

      try {
        await updateCurrentProfile(user.id, {
          avatar_path: avatarPath,
          display_name: cleanName,
          preferred_language: locale,
        });
      } catch (error) {
        if (uploadedAvatarPath) {
          await removeOwnAvatar(uploadedAvatarPath, user.id).catch(() => undefined);
        }
        throw error;
      }

      await replaceUserInterests(user.id, selectedInterests);
      if (uploadedAvatarPath && previousAvatarPath) {
        await removeOwnAvatar(previousAvatarPath, user.id).catch(() => undefined);
      }
    },
    onSuccess: async () => {
      setAvatar(null);
      setNotice(t('account.saved'));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['private', 'profile', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['private', 'interests', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['public', 'recommendations'] }),
      ]);
    },
  });

  if (!user) {
    return (
      <FeedbackState
        description={t('account.loginRequired')}
        title={t('account.sessionRequired')}
      />
    );
  }
  if (profileQuery.isPending || categoriesQuery.isPending || interestsQuery.isPending) {
    return <LoadingState label={t('account.loading')} />;
  }

  const avatarUri = avatar?.uri ?? getPublicAvatarUrl(profileQuery.data?.avatar_path ?? null);

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
      <SurfaceCard style={{ alignItems: 'center' }}>
        <AppAvatar label={displayName || user.email || 'MV'} size={88} uri={avatarUri} />
        <AppButton
          label={t('account.choosePhoto')}
          onPress={() =>
            void pickCompressedImage(720)
              .then((image) => image && setAvatar(image))
              .catch((error: Error) => setNotice(error.message))
          }
          variant="secondary"
        />
      </SurfaceCard>

      <AppInput
        label={t('auth.displayName')}
        maxLength={80}
        onChangeText={setDisplayName}
        value={displayName}
      />

      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ ...typography.heading, color: colors.label }}>
          {t('account.language')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
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
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text selectable style={{ ...typography.heading, color: colors.label }}>
          {t('account.interests')}
        </Text>
        <Text selectable style={{ ...typography.body, color: colors.secondaryLabel }}>
          {t('account.interestsDescription')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(categoriesQuery.data ?? []).map((category) => (
            <FilterChip
              color={category.color}
              key={category.id}
              label={category.name}
              onPress={() =>
                setSelectedInterests((current) =>
                  current.includes(category.id)
                    ? current.filter((id) => id !== category.id)
                    : [...current, category.id],
                )
              }
              selected={selectedInterests.includes(category.id)}
            />
          ))}
        </View>
      </View>

      {notice ? <AuthNotice message={notice} tone="success" /> : null}
      {saveMutation.error ? <AuthNotice message={(saveMutation.error as Error).message} /> : null}
      <AppButton
        label={t('common.save')}
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      />
    </ScrollView>
  );
}
