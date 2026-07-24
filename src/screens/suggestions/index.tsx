import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getTourismCategories } from '@/services/catalog/category-service';
import { createPlaceSuggestion, getOwnSuggestions } from '@/services/community/community-service';
import { colors, layout, spacing, typography } from '@/theme';

export function SuggestionsScreen() {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includeEnglish, setIncludeEnglish] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('-0.9538');
  const [longitude, setLongitude] = useState('-80.7324');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories(locale),
    queryKey: ['public', 'categories', locale],
  });
  const suggestionsQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getOwnSuggestions(user!.id),
    queryKey: ['private', 'suggestions', user?.id],
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !categoryId) throw new Error(t('suggestions.selectCategory'));
      if (name.trim().length < 2 || description.trim().length < 20 || address.trim().length < 3)
        throw new Error(t('suggestions.incomplete'));
      if (
        includeEnglish &&
        ((nameEn.trim().length > 0 && nameEn.trim().length < 2) ||
          (descriptionEn.trim().length > 0 && descriptionEn.trim().length < 20))
      )
        throw new Error(t('suggestions.englishIncomplete'));
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      )
        throw new Error(t('suggestions.invalidCoordinates'));
      if (evidenceUrl && !/^https:\/\//i.test(evidenceUrl.trim()))
        throw new Error(t('suggestions.invalidEvidence'));
      return createPlaceSuggestion(user.id, {
        address,
        categoryId,
        description,
        descriptionEn: includeEnglish ? descriptionEn : undefined,
        evidenceUrl,
        latitude: lat,
        longitude: lng,
        name,
        nameEn: includeEnglish ? nameEn : undefined,
      });
    },
    onSuccess: async () => {
      setName('');
      setDescription('');
      setDescriptionEn('');
      setIncludeEnglish(false);
      setNameEn('');
      setAddress('');
      setEvidenceUrl('');
      await queryClient.invalidateQueries({ queryKey: ['private', 'suggestions', user?.id] });
    },
  });

  if (!user)
    return (
      <FeedbackState
        description={t('suggestions.loginRequired')}
        title={t('account.sessionRequired')}
      />
    );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.lg,
        maxWidth: layout.contentMaxWidth,
        padding: spacing.lg,
        width: '100%',
      }}
      style={{ backgroundColor: colors.background }}
    >
      <Text selectable style={{ ...typography.heading, color: colors.label }}>
        {t('suggestions.title')}
      </Text>
      <AppInput label={t('suggestions.name')} maxLength={150} onChangeText={setName} value={name} />
      <AppInput
        label={t('suggestions.description')}
        maxLength={1500}
        multiline
        onChangeText={setDescription}
        value={description}
      />
      <SurfaceCard>
        <View style={{ gap: spacing.sm }}>
          <Text selectable style={{ ...typography.bodyStrong, color: colors.label }}>
            {t('suggestions.englishTitle')}
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, lineHeight: 20 }}>
            {t('suggestions.englishHelp')}
          </Text>
          <FilterChip
            label={t('suggestions.addEnglish')}
            onPress={() => setIncludeEnglish((current) => !current)}
            selected={includeEnglish}
          />
          {includeEnglish ? (
            <>
              <AppInput
                autoCapitalize="words"
                label={t('suggestions.nameEnglish')}
                maxLength={150}
                onChangeText={setNameEn}
                value={nameEn}
              />
              <AppInput
                label={t('suggestions.descriptionEnglish')}
                maxLength={1500}
                multiline
                onChangeText={setDescriptionEn}
                value={descriptionEn}
              />
            </>
          ) : null}
        </View>
      </SurfaceCard>
      <AppInput
        label={t('suggestions.address')}
        maxLength={250}
        onChangeText={setAddress}
        value={address}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label={t('suggestions.latitude')}
            onChangeText={setLatitude}
            value={latitude}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label={t('suggestions.longitude')}
            onChangeText={setLongitude}
            value={longitude}
          />
        </View>
      </View>
      <AppInput
        autoCapitalize="none"
        keyboardType="url"
        label={t('suggestions.evidence')}
        onChangeText={setEvidenceUrl}
        value={evidenceUrl}
      />
      {categoriesQuery.isPending ? (
        <LoadingState label={t('suggestions.categoriesLoading')} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(categoriesQuery.data ?? []).map((category) => (
            <FilterChip
              color={category.color}
              key={category.id}
              label={category.name}
              onPress={() => setCategoryId(category.id)}
              selected={categoryId === category.id}
            />
          ))}
        </View>
      )}
      {mutation.isSuccess ? <AuthNotice message={t('suggestions.sent')} tone="success" /> : null}
      {mutation.error ? <AuthNotice message={(mutation.error as Error).message} /> : null}
      <AppButton
        label={t('suggestions.send')}
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />

      <Text selectable style={{ ...typography.heading, color: colors.label }}>
        {t('suggestions.mine')}
      </Text>
      {suggestionsQuery.isPending ? (
        <LoadingState label={t('suggestions.loading')} />
      ) : suggestionsQuery.data?.length ? (
        suggestionsQuery.data.map((suggestion) => (
          <SurfaceCard key={suggestion.id}>
            <Text style={{ ...typography.bodyStrong, color: colors.label }}>{suggestion.name}</Text>
            <Text style={{ color: colors.secondaryLabel }}>
              {t('suggestions.status')}: {statusLabel(suggestion.status, t)}
            </Text>
            {suggestion.reviewNotes ? (
              <Text style={{ color: colors.secondaryLabel }}>{suggestion.reviewNotes}</Text>
            ) : null}
          </SurfaceCard>
        ))
      ) : (
        <FeedbackState
          description={t('suggestions.emptyDescription')}
          title={t('suggestions.emptyTitle')}
        />
      )}
    </ScrollView>
  );
}

function statusLabel(status: string, t: ReturnType<typeof useLocale>['t']) {
  return (
    (
      {
        archived: t('suggestions.status.archived'),
        pending: t('suggestions.status.pending'),
        published: t('suggestions.status.published'),
        rejected: t('suggestions.status.rejected'),
      } as Record<string, string>
    )[status] ?? status
  );
}
