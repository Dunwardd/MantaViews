import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, Share, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { PlaceCover } from '@/components/places/place-cover';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { RatingDisplay } from '@/components/ui/rating-display';
import { StatusCard } from '@/components/ui/status-card';
import { useLocale } from '@/providers/locale-provider';
import { getPlaceDetail } from '@/services/catalog/place-service';
import { getPublishedReviews } from '@/services/reviews/review-service';
import { brandColors, colors, layout, spacing } from '@/theme';

type PlaceDetailScreenProps = {
  placeId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PlaceDetailScreen({ placeId }: PlaceDetailScreenProps) {
  const { locale } = useLocale();
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    tone: 'error' | 'success';
  } | null>(null);
  const hasValidId = placeId !== null && UUID_PATTERN.test(placeId);
  const detailQuery = useQuery({
    enabled: hasValidId,
    queryFn: () => getPlaceDetail(placeId as string, locale),
    queryKey: ['public', 'place-detail', locale, placeId],
  });
  const reviewsQuery = useQuery({
    enabled: hasValidId,
    queryFn: () => getPublishedReviews(placeId as string),
    queryKey: ['public', 'reviews', placeId],
  });

  const openExternalUrl = async (url: string) => {
    setActionNotice(null);
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsafe protocol');
      await Linking.openURL(parsedUrl.toString());
    } catch {
      setActionNotice({
        message: 'No pudimos abrir el enlace en este dispositivo.',
        tone: 'error',
      });
    }
  };

  const callPhone = async (phone: string) => {
    setActionNotice(null);
    const safeNumber = phone.replace(/[^+\d]/g, '');
    if (safeNumber.length < 7) {
      setActionNotice({ message: 'El número de teléfono no es válido.', tone: 'error' });
      return;
    }
    try {
      await Linking.openURL(`tel:${safeNumber}`);
    } catch {
      setActionNotice({ message: 'No pudimos iniciar la llamada.', tone: 'error' });
    }
  };

  if (!hasValidId) {
    return (
      <PageState
        title="Lugar no válido"
        description="El enlace no contiene un identificador válido."
      />
    );
  }

  if (detailQuery.isPending) {
    return <PageLoading label="Consultando el lugar en Supabase…" />;
  }

  if (detailQuery.isError) {
    return (
      <PageContainer>
        <FeedbackState
          actionLabel="Reintentar"
          description="Revisa tu conexión e inténtalo otra vez."
          onAction={() => void detailQuery.refetch()}
          title="No pudimos consultar este lugar"
          tone="error"
        />
      </PageContainer>
    );
  }

  const place = detailQuery.data;
  if (!place) {
    return (
      <PageState
        title="Lugar no encontrado"
        description="El lugar no existe o todavía no está publicado."
      />
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  const coverImage = place.images.find((image) => image.isCover) ?? place.images[0];
  const visibleGallery = place.images.filter((image) => image.url);
  const hasOpeningHours = Object.keys(place.openingHours ?? {}).length > 0;

  const sharePlace = async () => {
    setActionNotice(null);
    const message = `Descubre ${place.name} en MantaViews. ${place.shortDescription}\n${mapsUrl}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        if (navigator.share) {
          await navigator.share({ text: message, title: place.name, url: mapsUrl });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          setActionNotice({ message: 'Información copiada para compartir.', tone: 'success' });
        } else {
          throw new Error('Share unavailable');
        }
      } else {
        await Share.share({ message, title: place.name });
      }
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      setActionNotice({ message: 'No pudimos compartir el lugar.', tone: 'error' });
    }
  };

  return (
    <PageContainer>
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderCurve: 'continuous',
          borderRadius: 28,
          borderWidth: 1,
          overflow: 'hidden',
        }}
      >
        <PlaceCover
          altText={coverImage?.altText}
          categoryColor={place.category.color}
          height={260}
          name={place.name}
          url={coverImage?.url}
        />
        <View style={{ gap: spacing.md, padding: spacing.xl }}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                backgroundColor: place.category.color,
                borderRadius: 999,
                height: 11,
                width: 11,
              }}
            />
            <Text style={{ color: place.category.color, fontSize: 13, fontWeight: '900' }}>
              {place.category.name.toUpperCase()}
            </Text>
            {place.isFeatured ? <Badge label="DESTACADO" /> : null}
          </View>
          <Text selectable style={{ color: colors.label, fontSize: 30, fontWeight: '900' }}>
            {place.name}
          </Text>
          <Text selectable style={{ color: colors.secondaryLabel, fontSize: 16, lineHeight: 24 }}>
            {place.shortDescription}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <MetricCard label="Valoración" value={`${place.stats.averageRating.toFixed(1)} / 5`} />
        <MetricCard label="Reseñas" value={String(place.stats.reviewCount)} />
        <MetricCard label="Favoritos" value={String(place.stats.favoriteCount)} />
        <MetricCard
          label="Sí es turístico"
          value={`${place.stats.touristicPercentage.toFixed(0)}%`}
        />
      </View>

      <InformationSection title="Acerca del lugar">
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15, lineHeight: 24 }}>
          {place.description}
        </Text>
      </InformationSection>

      <InformationSection title="Información para tu visita">
        <InformationRow label="Dirección" value={place.address} />
        <InformationRow
          label="Coordenadas"
          value={`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`}
        />
        <InformationRow label="Precio" value={formatPriceLevel(place.priceLevel)} />
        <InformationRow
          label="Horario"
          value={
            hasOpeningHours
              ? formatOpeningHours(place.openingHours)
              : 'Consulta el horario antes de visitar'
          }
        />
        <InformationRow label="Teléfono" value={place.phone ?? 'No disponible'} />
        <InformationRow label="Sitio web" value={place.websiteUrl ?? 'No disponible'} />
      </InformationSection>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flexGrow: 1, minWidth: 220 }}>
          <AppButton
            label="Mostrar ruta en Google Maps"
            onPress={() => void openExternalUrl(mapsUrl)}
          />
        </View>
        {place.phone ? (
          <View style={{ flexGrow: 1, minWidth: 160 }}>
            <AppButton
              label="Llamar"
              onPress={() => void callPhone(place.phone as string)}
              variant="secondary"
            />
          </View>
        ) : null}
        {place.websiteUrl ? (
          <View style={{ flexGrow: 1, minWidth: 180 }}>
            <AppButton
              label="Visitar sitio web"
              onPress={() => void openExternalUrl(place.websiteUrl as string)}
              variant="secondary"
            />
          </View>
        ) : null}
        <View style={{ flexGrow: 1, minWidth: 180 }}>
          <AppButton
            label="Compartir lugar"
            onPress={() => void sharePlace()}
            variant="secondary"
          />
        </View>
      </View>
      {actionNotice ? <AuthNotice message={actionNotice.message} tone={actionNotice.tone} /> : null}

      <InformationSection title="Galería">
        {visibleGallery.length === 0 ? (
          <FeedbackState
            description="Todavía no hay fotografías aprobadas para este lugar."
            title="Galería próximamente"
          />
        ) : (
          <ScrollView
            contentContainerStyle={{ gap: spacing.md }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {visibleGallery.map((image) => (
              <View key={image.id} style={{ gap: spacing.sm, width: 280 }}>
                <Image
                  accessibilityLabel={image.altText || `Fotografía de ${place.name}`}
                  contentFit="cover"
                  source={{ uri: image.url as string }}
                  style={{ borderRadius: 18, height: 190, width: 280 }}
                  transition={180}
                />
                {image.altText ? (
                  <Text selectable style={{ color: colors.secondaryLabel, fontSize: 12 }}>
                    {image.altText}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        )}
      </InformationSection>

      <InformationSection title="Opiniones de visitantes">
        {reviewsQuery.isPending ? (
          <LoadingState label="Consultando reseñas…" />
        ) : reviewsQuery.isError ? (
          <FeedbackState
            actionLabel="Reintentar"
            description="No pudimos cargar las opiniones publicadas."
            onAction={() => void reviewsQuery.refetch()}
            title="Reseñas no disponibles"
            tone="error"
          />
        ) : reviewsQuery.data.length === 0 ? (
          <FeedbackState
            description="Sé la primera persona en compartir una opinión cuando habilitemos la participación."
            title="Aún no hay reseñas"
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {reviewsQuery.data.map((review) => (
              <View
                key={review.id}
                style={{
                  borderBottomColor: colors.separator,
                  borderBottomWidth: 1,
                  gap: spacing.sm,
                  paddingBottom: spacing.md,
                }}
              >
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                  <AppAvatar
                    label={review.author.displayName}
                    size={42}
                    uri={review.author.avatarUrl}
                  />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text
                      selectable
                      style={{ color: colors.label, fontSize: 15, fontWeight: '800' }}
                    >
                      {review.author.displayName}
                    </Text>
                    <Text selectable style={{ color: colors.secondaryLabel, fontSize: 12 }}>
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                        new Date(review.createdAt),
                      )}
                    </Text>
                  </View>
                  <RatingDisplay value={review.rating} />
                </View>
                <Text
                  selectable
                  style={{ color: colors.secondaryLabel, fontSize: 14, lineHeight: 21 }}
                >
                  {review.comment || 'Esta persona dejó una valoración sin comentario.'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </InformationSection>
    </PageContainer>
  );
}

function PageContainer({ children }: { children: ReactNode }) {
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
      {children}
    </ScrollView>
  );
}

function PageLoading({ label }: { label: string }) {
  return (
    <PageContainer>
      <LoadingState label={label} />
    </PageContainer>
  );
}

function PageState({ description, title }: { description: string; title: string }) {
  return (
    <PageContainer>
      <StatusCard description={description} title={title} />
    </PageContainer>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: brandColors.sun,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: brandColors.deepTeal, fontSize: 11, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

function InformationSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderCurve: 'continuous',
        borderRadius: 22,
        borderWidth: 1,
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <Text selectable style={{ color: colors.label, fontSize: 20, fontWeight: '800' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 12, fontWeight: '700' }}>
        {label.toUpperCase()}
      </Text>
      <Text selectable style={{ color: colors.label, fontSize: 15, lineHeight: 22 }}>
        {value}
      </Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.separator,
        borderCurve: 'continuous',
        borderRadius: 18,
        borderWidth: 1,
        flexBasis: '47%',
        flexGrow: 1,
        gap: spacing.xs,
        minWidth: 140,
        padding: spacing.md,
      }}
    >
      <Text
        selectable
        style={{
          color: brandColors.deepTeal,
          fontSize: 20,
          fontVariant: ['tabular-nums'],
          fontWeight: '900',
        }}
      >
        {value}
      </Text>
      <Text selectable style={{ color: colors.secondaryLabel, fontSize: 13 }}>
        {label}
      </Text>
    </View>
  );
}

function formatPriceLevel(priceLevel: number | null) {
  if (priceLevel === null) return 'No especificado';
  if (priceLevel === 0) return 'Acceso gratuito';
  return '$'.repeat(Math.max(1, Math.min(priceLevel, 4)));
}

function formatOpeningHours(openingHours: Record<string, unknown>) {
  return Object.entries(openingHours)
    .map(([day, hours]) => `${day}: ${String(hours)}`)
    .join('\n');
}
