import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';

import { AdminCoordinateMap } from '@/components/admin/admin-coordinate-map';
import { AuthNotice } from '@/components/auth/auth-notice';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import {
  archiveAdminPlace,
  createAdminPlace,
  getAdminPlaces,
  getAdminSummary,
  getModerationItems,
  getOpenReports,
  getPendingSuggestions,
  moderateContent,
  parsePoint,
  resolveReport,
  reviewSuggestion,
  updateAdminPlace,
  type AdminPlace,
  type AdminPlaceInput,
  type ContentStatus,
} from '@/services/admin/admin-service';
import { getTourismCategories } from '@/services/catalog/category-service';
import { brandColors, colors, spacing, typography } from '@/theme';

type Section = 'summary' | 'places' | 'suggestions' | 'moderation' | 'reports';

const sectionOptions: { label: string; value: Section }[] = [
  { label: 'Resumen', value: 'summary' },
  { label: 'Lugares', value: 'places' },
  { label: 'Sugerencias', value: 'suggestions' },
  { label: 'Moderación', value: 'moderation' },
  { label: 'Reportes', value: 'reports' },
];

export function AdminDashboardScreen() {
  const [section, setSection] = useState<Section>('summary');
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({ queryFn: getAdminSummary, queryKey: ['admin', 'summary'] });
  const placesQuery = useQuery({
    enabled: section === 'places',
    queryFn: getAdminPlaces,
    queryKey: ['admin', 'places'],
  });
  const suggestionsQuery = useQuery({
    enabled: section === 'suggestions',
    queryFn: getPendingSuggestions,
    queryKey: ['admin', 'suggestions'],
  });
  const moderationQuery = useQuery({
    enabled: section === 'moderation',
    queryFn: getModerationItems,
    queryKey: ['admin', 'moderation'],
  });
  const reportsQuery = useQuery({
    enabled: section === 'reports',
    queryFn: getOpenReports,
    queryKey: ['admin', 'reports'],
  });

  const refreshAdmin = async (...keys: string[]) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] }),
      ...keys.map((key) => queryClient.invalidateQueries({ queryKey: ['admin', key] })),
    ]);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        alignSelf: 'center',
        gap: spacing.lg,
        maxWidth: 1240,
        padding: spacing.lg,
        width: '100%',
      }}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.display, color: brandColors.deepTeal }}>Panel MantaViews</Text>
        <Text style={{ ...typography.body, color: colors.secondaryLabel }}>
          Catálogo, comunidad y moderación en una consola protegida para administradores.
        </Text>
      </View>
      {Platform.OS !== 'web' ? (
        <AuthNotice
          message="Este panel está optimizado para navegador de escritorio."
          tone="success"
        />
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {sectionOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            onPress={() => setSection(option.value)}
            selected={section === option.value}
          />
        ))}
      </View>

      {section === 'summary' ? (
        <SummarySection query={summaryQuery} onNavigate={setSection} />
      ) : null}
      {section === 'places' ? (
        <PlacesSection
          onRefresh={() => refreshAdmin('places')}
          places={placesQuery.data ?? []}
          query={placesQuery}
        />
      ) : null}
      {section === 'suggestions' ? (
        <SuggestionsSection
          items={suggestionsQuery.data ?? []}
          onRefresh={() => refreshAdmin('suggestions', 'places')}
          query={suggestionsQuery}
        />
      ) : null}
      {section === 'moderation' ? (
        <ModerationSection
          items={moderationQuery.data ?? []}
          onRefresh={() => refreshAdmin('moderation')}
          query={moderationQuery}
        />
      ) : null}
      {section === 'reports' ? (
        <ReportsSection
          items={reportsQuery.data ?? []}
          onRefresh={() => refreshAdmin('reports', 'places', 'moderation')}
          query={reportsQuery}
        />
      ) : null}
    </ScrollView>
  );
}

function SummarySection({
  query,
  onNavigate,
}: {
  query: UseQueryResult<Awaited<ReturnType<typeof getAdminSummary>>, Error>;
  onNavigate: (section: Section) => void;
}) {
  if (query.isPending) return <LoadingState label="Calculando pendientes…" />;
  if (query.isError) return <QueryError onRetry={() => void query.refetch()} />;
  const cards: { count: number; label: string; section: Section }[] = [
    { count: query.data.places, label: 'Lugares pendientes', section: 'places' },
    { count: query.data.suggestions, label: 'Sugerencias nuevas', section: 'suggestions' },
    { count: query.data.images, label: 'Fotografías pendientes', section: 'moderation' },
    { count: query.data.reports, label: 'Reportes abiertos', section: 'reports' },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {cards.map((card) => (
        <SurfaceCard key={card.label} style={{ flexBasis: 230, flexGrow: 1 }}>
          <Text style={{ color: brandColors.primary, fontSize: 34, fontWeight: '900' }}>
            {card.count}
          </Text>
          <Text style={{ ...typography.bodyStrong, color: colors.label }}>{card.label}</Text>
          <AppButton label="Revisar" onPress={() => onNavigate(card.section)} variant="secondary" />
        </SurfaceCard>
      ))}
    </View>
  );
}

type PlacesSectionProps = {
  onRefresh: () => Promise<void>;
  places: AdminPlace[];
  query: UseQueryResult<AdminPlace[], Error>;
};

function PlacesSection({ onRefresh, places, query }: PlacesSectionProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [selected, setSelected] = useState<AdminPlace | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { action: 'archive' | 'publish'; id: string }) =>
      action === 'archive' ? archiveAdminPlace(id) : updateAdminPlace(id, { status: 'published' }),
    onSuccess: onRefresh,
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return places.filter((place) => {
      const names = place.place_translations.map((translation) => translation.name).join(' ');
      return (
        (status === 'all' || place.status === status) &&
        (!term || `${names} ${place.address}`.toLocaleLowerCase().includes(term))
      );
    });
  }, [places, search, status]);

  if (query.isPending) return <LoadingState label="Cargando catálogo administrativo…" />;
  if (query.isError) return <QueryError onRetry={() => void query.refetch()} />;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flexGrow: 1, minWidth: 260 }}>
          <AppInput label="Buscar por nombre o dirección" onChangeText={setSearch} value={search} />
        </View>
        <AppButton
          label="Nuevo lugar"
          onPress={() => {
            setSelected(null);
            setShowEditor(true);
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {(['all', 'pending', 'published', 'archived', 'rejected'] as const).map((value) => (
          <FilterChip
            key={value}
            label={statusLabel(value)}
            onPress={() => setStatus(value)}
            selected={status === value}
          />
        ))}
      </View>
      {showEditor ? (
        <PlaceEditor
          onCancel={() => setShowEditor(false)}
          onSaved={async () => {
            setShowEditor(false);
            await onRefresh();
          }}
          place={selected}
        />
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {filtered.length === 0 ? (
          <FeedbackState description="Prueba otra búsqueda o estado." title="Sin lugares" />
        ) : (
          filtered.map((place) => {
            const name =
              place.place_translations.find((translation) => translation.locale === 'es')?.name ??
              'Sin nombre';
            return (
              <SurfaceCard
                key={place.id}
                style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
              >
                <View style={{ flex: 1, minWidth: 230, gap: spacing.xs }}>
                  <Text style={{ ...typography.bodyStrong, color: colors.label }}>{name}</Text>
                  <Text style={{ color: colors.secondaryLabel }}>
                    {place.address} · {statusLabel(place.status)}
                  </Text>
                </View>
                <AppButton
                  label="Editar"
                  onPress={() => {
                    setSelected(place);
                    setShowEditor(true);
                  }}
                  variant="secondary"
                />
                {place.status !== 'published' ? (
                  <AppButton
                    label="Publicar"
                    loading={actionMutation.isPending}
                    onPress={() => actionMutation.mutate({ action: 'publish', id: place.id })}
                  />
                ) : null}
                {place.status !== 'archived' ? (
                  <AppButton
                    label="Archivar"
                    loading={actionMutation.isPending}
                    onPress={() =>
                      confirmAction(
                        'Archivar lugar',
                        'El lugar dejará de ser visible para turistas.',
                        () => actionMutation.mutate({ action: 'archive', id: place.id }),
                      )
                    }
                    variant="danger"
                  />
                ) : null}
              </SurfaceCard>
            );
          })
        )}
      </View>
    </View>
  );
}

type PlaceForm = {
  address: string;
  categoryId: number | null;
  descriptionEn: string;
  descriptionEs: string;
  featured: boolean;
  latitude: number;
  longitude: number;
  nameEn: string;
  nameEs: string;
  phone: string;
  priceLevel: string;
  shortEn: string;
  shortEs: string;
  status: 'archived' | 'pending' | 'published';
  websiteUrl: string;
};

function emptyPlaceForm(): PlaceForm {
  return {
    address: '',
    categoryId: null,
    descriptionEn: '',
    descriptionEs: '',
    featured: false,
    latitude: -0.9538,
    longitude: -80.7324,
    nameEn: '',
    nameEs: '',
    phone: '',
    priceLevel: '',
    shortEn: '',
    shortEs: '',
    status: 'pending',
    websiteUrl: '',
  };
}

function PlaceEditor({
  onCancel,
  onSaved,
  place,
}: {
  onCancel: () => void;
  onSaved: () => Promise<void>;
  place: AdminPlace | null;
}) {
  const [form, setForm] = useState<PlaceForm>(emptyPlaceForm);
  const categoriesQuery = useQuery({
    queryFn: () => getTourismCategories('es'),
    queryKey: ['public', 'categories', 'es'],
  });
  useEffect(() => {
    if (!place) {
      setForm(emptyPlaceForm());
      return;
    }
    const es = place.place_translations.find((item) => item.locale === 'es');
    const en = place.place_translations.find((item) => item.locale === 'en');
    const point = parsePoint(place.location);
    setForm({
      address: place.address,
      categoryId: place.category_id,
      descriptionEn: en?.description ?? '',
      descriptionEs: es?.description ?? '',
      featured: place.is_featured,
      latitude: point.latitude,
      longitude: point.longitude,
      nameEn: en?.name ?? '',
      nameEs: es?.name ?? '',
      phone: place.phone ?? '',
      priceLevel: place.price_level === null ? '' : String(place.price_level),
      shortEn: en?.short_description ?? '',
      shortEs: es?.short_description ?? '',
      status: place.status === 'rejected' ? 'pending' : place.status,
      websiteUrl: place.website_url ?? '',
    });
  }, [place]);
  const set = <K extends keyof PlaceForm>(key: K, value: PlaceForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const mapChange = useCallback(
    (coordinate: { latitude: number; longitude: number }) =>
      setForm((current) => ({ ...current, ...coordinate })),
    [],
  );
  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.categoryId) throw new Error('Selecciona una categoría.');
      const required = [
        form.address,
        form.nameEs,
        form.nameEn,
        form.shortEs,
        form.shortEn,
        form.descriptionEs,
        form.descriptionEn,
      ];
      if (required.some((value) => !value.trim()))
        throw new Error('Completa todos los campos obligatorios en español e inglés.');
      const input: AdminPlaceInput = {
        address: form.address.trim(),
        categoryId: form.categoryId,
        isFeatured: form.featured,
        latitude: form.latitude,
        longitude: form.longitude,
        openingHours: {},
        phone: form.phone.trim() || null,
        priceLevel: form.priceLevel ? Number(form.priceLevel) : null,
        status: form.status,
        translations: {
          en: {
            description: form.descriptionEn.trim(),
            name: form.nameEn.trim(),
            shortDescription: form.shortEn.trim(),
          },
          es: {
            description: form.descriptionEs.trim(),
            name: form.nameEs.trim(),
            shortDescription: form.shortEs.trim(),
          },
        },
        websiteUrl: form.websiteUrl.trim() || null,
      };
      return place ? updateAdminPlace(place.id, input) : createAdminPlace(input);
    },
    onSuccess: onSaved,
  });
  return (
    <Panel title={place ? 'Editar lugar' : 'Crear lugar bilingüe'}>
      <AppInput
        label="Dirección"
        onChangeText={(value) => set('address', value)}
        value={form.address}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {(categoriesQuery.data ?? []).map((category) => (
          <FilterChip
            color={category.color}
            key={category.id}
            label={category.name}
            onPress={() => set('categoryId', category.id)}
            selected={form.categoryId === category.id}
          />
        ))}
      </View>
      <LanguageFields
        description={form.descriptionEs}
        language="Español"
        name={form.nameEs}
        onDescription={(value) => set('descriptionEs', value)}
        onName={(value) => set('nameEs', value)}
        onShort={(value) => set('shortEs', value)}
        short={form.shortEs}
      />
      <LanguageFields
        description={form.descriptionEn}
        language="English"
        name={form.nameEn}
        onDescription={(value) => set('descriptionEn', value)}
        onName={(value) => set('nameEn', value)}
        onShort={(value) => set('shortEn', value)}
        short={form.shortEn}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <AppInput
            keyboardType="phone-pad"
            label="Teléfono (opcional)"
            onChangeText={(value) => set('phone', value)}
            value={form.phone}
          />
        </View>
        <View style={{ flex: 1, minWidth: 180 }}>
          <AppInput
            keyboardType="number-pad"
            label="Nivel de precio 0-4"
            onChangeText={(value) => set('priceLevel', value)}
            value={form.priceLevel}
          />
        </View>
        <View style={{ flex: 2, minWidth: 260 }}>
          <AppInput
            autoCapitalize="none"
            keyboardType="url"
            label="Sitio HTTPS (opcional)"
            onChangeText={(value) => set('websiteUrl', value)}
            value={form.websiteUrl}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {(['pending', 'published', 'archived'] as const).map((value) => (
          <FilterChip
            key={value}
            label={statusLabel(value)}
            onPress={() => set('status', value)}
            selected={form.status === value}
          />
        ))}
        <FilterChip
          color={brandColors.sun}
          label="Destacado"
          onPress={() => set('featured', !form.featured)}
          selected={form.featured}
        />
      </View>
      <AdminCoordinateMap
        latitude={form.latitude}
        longitude={form.longitude}
        onChange={mapChange}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label="Latitud"
            onChangeText={(value) => set('latitude', Number(value))}
            value={String(form.latitude)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput
            keyboardType="decimal-pad"
            label="Longitud"
            onChangeText={(value) => set('longitude', Number(value))}
            value={String(form.longitude)}
          />
        </View>
      </View>
      {mutation.error ? <AuthNotice message={(mutation.error as Error).message} /> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppButton label="Cancelar" onPress={onCancel} variant="secondary" />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            label="Guardar lugar"
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </View>
      </View>
    </Panel>
  );
}

function LanguageFields({
  description,
  language,
  name,
  onDescription,
  onName,
  onShort,
  short,
}: {
  description: string;
  language: string;
  name: string;
  onDescription: (value: string) => void;
  onName: (value: string) => void;
  onShort: (value: string) => void;
  short: string;
}) {
  return (
    <SurfaceCard>
      <Text style={{ ...typography.heading, color: colors.label }}>{language}</Text>
      <AppInput label="Nombre" maxLength={150} onChangeText={onName} value={name} />
      <AppInput
        label="Descripción corta"
        maxLength={280}
        multiline
        onChangeText={onShort}
        value={short}
      />
      <AppInput
        label="Descripción completa"
        maxLength={5000}
        multiline
        onChangeText={onDescription}
        value={description}
      />
    </SurfaceCard>
  );
}

function SuggestionsSection({
  items,
  onRefresh,
  query,
}: {
  items: Awaited<ReturnType<typeof getPendingSuggestions>>;
  onRefresh: () => Promise<void>;
  query: UseQueryResult<Awaited<ReturnType<typeof getPendingSuggestions>>, Error>;
}) {
  const mutation = useMutation({
    mutationFn: ({ id, decision }: { decision: 'approve' | 'reject'; id: string }) =>
      reviewSuggestion(id, decision),
    onSuccess: onRefresh,
  });
  if (query.isPending) return <LoadingState label="Cargando sugerencias…" />;
  if (query.isError) return <QueryError onRetry={() => void query.refetch()} />;
  if (!items.length)
    return <FeedbackState description="No existen propuestas pendientes." title="Bandeja al día" />;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <SurfaceCard key={item.id}>
          <Text style={{ ...typography.heading, color: colors.label }}>{item.name}</Text>
          <Text style={{ color: colors.secondaryLabel }}>{item.address}</Text>
          <Text style={{ color: colors.label, lineHeight: 21 }}>{item.description}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <AppButton
              label="Aprobar"
              loading={mutation.isPending}
              onPress={() => mutation.mutate({ decision: 'approve', id: item.id })}
            />
            <AppButton
              label="Rechazar"
              loading={mutation.isPending}
              onPress={() =>
                confirmAction(
                  'Rechazar sugerencia',
                  'La persona verá la sugerencia como rechazada.',
                  () => mutation.mutate({ decision: 'reject', id: item.id }),
                )
              }
              variant="danger"
            />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function ModerationSection({
  items,
  onRefresh,
  query,
}: {
  items: Awaited<ReturnType<typeof getModerationItems>>;
  onRefresh: () => Promise<void>;
  query: UseQueryResult<Awaited<ReturnType<typeof getModerationItems>>, Error>;
}) {
  const mutation = useMutation({
    mutationFn: ({
      decision,
      id,
      type,
    }: {
      decision: 'archive' | 'publish' | 'reject';
      id: string;
      type: 'image' | 'review';
    }) => moderateContent(type, id, decision),
    onSuccess: onRefresh,
  });
  if (query.isPending) return <LoadingState label="Cargando contenido…" />;
  if (query.isError) return <QueryError onRetry={() => void query.refetch()} />;
  if (!items.length)
    return <FeedbackState description="No hay contenido para revisar." title="Moderación al día" />;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <SurfaceCard key={`${item.type}-${item.id}`}>
          {item.image_url ? (
            <Image
              accessibilityLabel="Fotografía pendiente de moderación"
              contentFit="cover"
              source={{ uri: item.image_url }}
              style={{ borderRadius: 16, height: 220, maxWidth: 420, width: '100%' }}
            />
          ) : null}
          <Text style={{ ...typography.bodyStrong, color: colors.label }}>
            {item.type === 'image' ? 'Fotografía pendiente' : `Reseña · ${item.rating ?? 0}/5`}
          </Text>
          <Text style={{ color: colors.secondaryLabel }}>
            {item.comment ?? item.storage_path ?? item.id}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {item.type === 'image' ? (
              <AppButton
                label="Publicar"
                loading={mutation.isPending}
                onPress={() =>
                  mutation.mutate({ decision: 'publish', id: item.id, type: item.type })
                }
              />
            ) : null}
            <AppButton
              label="Rechazar"
              loading={mutation.isPending}
              onPress={() =>
                confirmAction('Rechazar contenido', 'El contenido dejará de ser visible.', () =>
                  mutation.mutate({ decision: 'reject', id: item.id, type: item.type }),
                )
              }
              variant="danger"
            />
            <AppButton
              label="Archivar"
              loading={mutation.isPending}
              onPress={() =>
                confirmAction('Archivar contenido', 'Esta acción es lógica y queda auditada.', () =>
                  mutation.mutate({ decision: 'archive', id: item.id, type: item.type }),
                )
              }
              variant="secondary"
            />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function ReportsSection({
  items,
  onRefresh,
  query,
}: {
  items: Awaited<ReturnType<typeof getOpenReports>>;
  onRefresh: () => Promise<void>;
  query: UseQueryResult<Awaited<ReturnType<typeof getOpenReports>>, Error>;
}) {
  const mutation = useMutation({
    mutationFn: ({
      action,
      id,
      resolution,
    }: {
      action: 'archive_target' | 'none';
      id: string;
      resolution: 'dismissed' | 'resolved';
    }) => resolveReport(id, resolution, action),
    onSuccess: onRefresh,
  });
  if (query.isPending) return <LoadingState label="Cargando reportes…" />;
  if (query.isError) return <QueryError onRetry={() => void query.refetch()} />;
  if (!items.length)
    return <FeedbackState description="No hay reportes abiertos." title="Reportes al día" />;
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <SurfaceCard key={item.id}>
          <Text style={{ ...typography.bodyStrong, color: colors.label }}>
            {item.target_type.toUpperCase()} · {item.reason.replaceAll('_', ' ')}
          </Text>
          <Text style={{ color: colors.secondaryLabel }}>
            {item.details || 'Sin detalles adicionales'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <AppButton
              label="Resolver"
              loading={mutation.isPending}
              onPress={() =>
                mutation.mutate({ action: 'none', id: item.id, resolution: 'resolved' })
              }
            />
            <AppButton
              label="Descartar"
              loading={mutation.isPending}
              onPress={() =>
                confirmAction(
                  'Descartar reporte',
                  'El reporte se cerrará sin modificar el contenido.',
                  () => mutation.mutate({ action: 'none', id: item.id, resolution: 'dismissed' }),
                )
              }
              variant="secondary"
            />
            <AppButton
              label="Resolver y archivar contenido"
              loading={mutation.isPending}
              onPress={() =>
                confirmAction(
                  'Archivar contenido reportado',
                  'El objetivo será archivado y el reporte quedará resuelto.',
                  () =>
                    mutation.mutate({
                      action: 'archive_target',
                      id: item.id,
                      resolution: 'resolved',
                    }),
                )
              }
              variant="danger"
            />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderRadius: 22,
        borderWidth: 1,
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <Text style={{ ...typography.heading, color: colors.label }}>{title}</Text>
      {children}
    </View>
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <FeedbackState
      actionLabel="Reintentar"
      description="No pudimos consultar la información administrativa."
      onAction={onRetry}
      title="Panel no disponible"
      tone="error"
    />
  );
}

function statusLabel(status: ContentStatus | 'all') {
  return (
    {
      all: 'Todos',
      archived: 'Archivado',
      pending: 'Pendiente',
      published: 'Publicado',
      rejected: 'Rechazado',
    } as const
  )[status];
}

function confirmAction(title: string, message: string, action: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) action();
    return;
  }
  Alert.alert(title, message, [
    { style: 'cancel', text: 'Cancelar' },
    { style: 'destructive', text: 'Confirmar', onPress: action },
  ]);
}
