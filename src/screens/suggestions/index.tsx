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
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      if (!user || !categoryId) throw new Error('Selecciona una categoría.');
      if (name.trim().length < 2 || description.trim().length < 20 || address.trim().length < 3)
        throw new Error(
          'Completa el nombre, la dirección y una descripción de al menos 20 caracteres.',
        );
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
        throw new Error('Las coordenadas no son válidas.');
      if (evidenceUrl && !/^https:\/\//i.test(evidenceUrl.trim()))
        throw new Error('La evidencia debe comenzar con https://.');
      return createPlaceSuggestion(user.id, {
        address,
        categoryId,
        description,
        evidenceUrl,
        latitude: lat,
        longitude: lng,
        name,
      });
    },
    onSuccess: async () => {
      setName('');
      setDescription('');
      setAddress('');
      setEvidenceUrl('');
      await queryClient.invalidateQueries({ queryKey: ['private', 'suggestions', user?.id] });
    },
  });

  if (!user)
    return (
      <FeedbackState description="Inicia sesión para proponer lugares." title="Sesión requerida" />
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
      <Text style={{ ...typography.heading, color: colors.label }}>Sugerir un lugar turístico</Text>
      <AppInput label="Nombre" maxLength={150} onChangeText={setName} value={name} />
      <AppInput
        label="Descripción"
        maxLength={1500}
        multiline
        onChangeText={setDescription}
        value={description}
      />
      <AppInput label="Dirección" maxLength={250} onChangeText={setAddress} value={address} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label="Latitud"
            onChangeText={setLatitude}
            value={latitude}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label="Longitud"
            onChangeText={setLongitude}
            value={longitude}
          />
        </View>
      </View>
      <AppInput
        autoCapitalize="none"
        keyboardType="url"
        label="Enlace de evidencia (opcional)"
        onChangeText={setEvidenceUrl}
        value={evidenceUrl}
      />
      {categoriesQuery.isPending ? (
        <LoadingState label="Cargando categorías…" />
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
      {mutation.isSuccess ? (
        <AuthNotice message="Sugerencia enviada. Quedó pendiente de revisión." tone="success" />
      ) : null}
      {mutation.error ? <AuthNotice message={(mutation.error as Error).message} /> : null}
      <AppButton
        label="Enviar sugerencia"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />

      <Text style={{ ...typography.heading, color: colors.label }}>Mis sugerencias</Text>
      {suggestionsQuery.isPending ? (
        <LoadingState label="Consultando sugerencias…" />
      ) : suggestionsQuery.data?.length ? (
        suggestionsQuery.data.map((suggestion) => (
          <SurfaceCard key={suggestion.id}>
            <Text style={{ ...typography.bodyStrong, color: colors.label }}>{suggestion.name}</Text>
            <Text style={{ color: colors.secondaryLabel }}>
              Estado: {statusLabel(suggestion.status)}
            </Text>
            {suggestion.reviewNotes ? (
              <Text style={{ color: colors.secondaryLabel }}>{suggestion.reviewNotes}</Text>
            ) : null}
          </SurfaceCard>
        ))
      ) : (
        <FeedbackState
          description="Las propuestas que envíes aparecerán aquí."
          title="Sin sugerencias"
        />
      )}
    </ScrollView>
  );
}

function statusLabel(status: string) {
  return (
    (
      {
        archived: 'Archivada',
        pending: 'Pendiente de revisión',
        published: 'Aprobada',
        rejected: 'Rechazada',
      } as Record<string, string>
    )[status] ?? status
  );
}
