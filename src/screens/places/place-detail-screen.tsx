import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { StatusCard } from '@/components/ui/status-card';
import { getPlaceDetail } from '@/services/catalog/place-service';
import { brandColors, colors, spacing } from '@/theme';

type PlaceDetailScreenProps = {
  placeId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PlaceDetailScreen({ placeId }: PlaceDetailScreenProps) {
  const [externalLinkError, setExternalLinkError] = useState<string | null>(null);
  const hasValidId = placeId !== null && UUID_PATTERN.test(placeId);
  const detailQuery = useQuery({
    enabled: hasValidId,
    queryFn: () => getPlaceDetail(placeId as string, 'es'),
    queryKey: ['public', 'place-detail', 'es', placeId],
  });

  const openExternalUrl = async (url: string) => {
    setExternalLinkError(null);

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Protocolo no permitido');
      }
      await Linking.openURL(parsedUrl.toString());
    } catch {
      setExternalLinkError('No pudimos abrir el enlace en este dispositivo.');
    }
  };

  if (!hasValidId) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg }}
        style={{ backgroundColor: colors.background }}
      >
        <StatusCard
          title="Lugar no válido"
          description="El enlace no contiene un identificador de lugar válido."
        />
      </ScrollView>
    );
  }

  if (detailQuery.isPending) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ alignItems: 'center', padding: spacing.xl }}
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator color={brandColors.primary} size="large" />
        <Text selectable style={{ color: colors.secondaryLabel }}>
          Consultando el lugar en Supabase…
        </Text>
      </ScrollView>
    );
  }

  if (detailQuery.isError) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}
        style={{ backgroundColor: colors.background }}
      >
        <AuthNotice message="No pudimos consultar este lugar. Revisa tu conexión e inténtalo otra vez." />
        <ActionButton label="Reintentar" onPress={() => void detailQuery.refetch()} />
      </ScrollView>
    );
  }

  const place = detailQuery.data;

  if (!place) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg }}
        style={{ backgroundColor: colors.background }}
      >
        <StatusCard
          title="Lugar no encontrado"
          description="El lugar no existe o todavía no está publicado."
        />
      </ScrollView>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  const hasOpeningHours = Object.keys(place.openingHours ?? {}).length > 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg }}
      style={{ backgroundColor: colors.background }}
    >
      <View
        style={{
          backgroundColor: `${place.category.color}20`,
          borderColor: `${place.category.color}50`,
          borderCurve: 'continuous',
          borderRadius: 28,
          borderWidth: 1,
          gap: spacing.md,
          padding: spacing.xl,
        }}
      >
        <View
          style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
        >
          <View
            style={{
              backgroundColor: place.category.color,
              borderRadius: 999,
              height: 11,
              width: 11,
            }}
          />
          <Text selectable style={{ color: place.category.color, fontSize: 13, fontWeight: '900' }}>
            {place.category.name.toUpperCase()}
          </Text>
          {place.isFeatured ? (
            <View
              style={{
                backgroundColor: brandColors.sun,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: brandColors.deepTeal, fontSize: 11, fontWeight: '900' }}>
                DESTACADO
              </Text>
            </View>
          ) : null}
        </View>
        <Text selectable style={{ color: colors.label, fontSize: 30, fontWeight: '900' }}>
          {place.name}
        </Text>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 16, lineHeight: 24 }}>
          {place.shortDescription}
        </Text>
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
        {place.phone ? <InformationRow label="Teléfono" value={place.phone} /> : null}
        {hasOpeningHours ? (
          <InformationRow label="Horario" value={formatOpeningHours(place.openingHours)} />
        ) : (
          <InformationRow label="Horario" value="Consulta el horario antes de visitar" />
        )}
      </InformationSection>

      <View style={{ gap: spacing.sm }}>
        <ActionButton
          label="Mostrar ruta en Google Maps"
          onPress={() => void openExternalUrl(mapsUrl)}
        />
        {place.websiteUrl ? (
          <ActionButton
            label="Visitar sitio web"
            onPress={() => void openExternalUrl(place.websiteUrl as string)}
            variant="secondary"
          />
        ) : null}
        {externalLinkError ? <AuthNotice message={externalLinkError} /> : null}
      </View>

      <StatusCard
        accent={place.category.color}
        title={
          place.images.length > 0
            ? `${place.images.length} imágenes publicadas`
            : 'Galería próximamente'
        }
        description={
          place.images.length > 0
            ? 'Las imágenes aprobadas están asociadas a esta ficha.'
            : 'Todavía no hay imágenes publicadas para este lugar.'
        }
      />
    </ScrollView>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

function ActionButton({ label, onPress, variant = 'primary' }: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: isPrimary ? brandColors.primary : colors.surface,
        borderColor: brandColors.primary,
        borderCurve: 'continuous',
        borderRadius: 16,
        borderWidth: 1,
        opacity: pressed ? 0.72 : 1,
        padding: spacing.md,
      })}
    >
      <Text
        style={{
          color: isPrimary ? brandColors.white : brandColors.primary,
          fontSize: 15,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type InformationSectionProps = {
  children: React.ReactNode;
  title: string;
};

function InformationSection({ children, title }: InformationSectionProps) {
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
