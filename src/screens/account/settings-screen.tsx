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
import { getPublicAvatarUrl, uploadAvatar } from '@/services/storage/image-service';
import { pickCompressedImage, type PreparedImage } from '@/services/storage/media-picker';
import { brandColors, colors, layout, spacing, typography } from '@/theme';

export function AccountSettingsScreen() {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
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
      if (!user) throw new Error('Inicia sesión para editar tu perfil.');
      const cleanName = displayName.trim();
      if (cleanName.length < 2 || cleanName.length > 80) {
        throw new Error('El nombre debe tener entre 2 y 80 caracteres.');
      }
      let avatarPath = profileQuery.data?.avatar_path ?? null;
      if (avatar) avatarPath = await uploadAvatar({ ...avatar, userId: user.id });
      await updateCurrentProfile(user.id, {
        avatar_path: avatarPath,
        display_name: cleanName,
        preferred_language: locale,
      });
      await replaceUserInterests(user.id, selectedInterests);
    },
    onSuccess: async () => {
      setAvatar(null);
      setNotice('Perfil e intereses guardados.');
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
        description="Inicia sesión para administrar tu cuenta."
        title="Sesión requerida"
      />
    );
  }
  if (profileQuery.isPending || categoriesQuery.isPending || interestsQuery.isPending) {
    return <LoadingState label="Preparando tu cuenta…" />;
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
          label="Elegir foto de perfil"
          onPress={() =>
            void pickCompressedImage(720)
              .then((image) => image && setAvatar(image))
              .catch((error: Error) => setNotice(error.message))
          }
          variant="secondary"
        />
      </SurfaceCard>

      <AppInput
        label="Nombre visible"
        maxLength={80}
        onChangeText={setDisplayName}
        value={displayName}
      />

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.heading, color: colors.label }}>Idioma</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <FilterChip label="Español" onPress={() => setLocale('es')} selected={locale === 'es'} />
          <FilterChip
            color={brandColors.ocean}
            label="English"
            onPress={() => setLocale('en')}
            selected={locale === 'en'}
          />
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ ...typography.heading, color: colors.label }}>Tus intereses</Text>
        <Text style={{ ...typography.body, color: colors.secondaryLabel }}>
          Elige las categorías que quieres priorizar en las recomendaciones.
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
        label="Guardar cambios"
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      />
    </ScrollView>
  );
}
