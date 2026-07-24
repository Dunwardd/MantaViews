import { Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import type { AdminDashboardData, ContentStatus } from '@/services/admin/admin-service';
import { brandColors, colors, radii, spacing, typography } from '@/theme';

type DashboardSection = 'moderation' | 'places' | 'reports' | 'suggestions';

type AdminDashboardSummaryProps = {
  data: AdminDashboardData;
  isRefreshing: boolean;
  onNavigate: (section: DashboardSection) => void;
  onRefresh: () => void;
};

export function AdminDashboardSummary({
  data,
  isRefreshing,
  onNavigate,
  onRefresh,
}: AdminDashboardSummaryProps) {
  const primaryMetrics = [
    {
      accent: brandColors.primary,
      detail: `+${data.growth30d.newPlaces} creados en 30 días`,
      label: 'Lugares publicados',
      value: data.metrics.publishedPlaces.toLocaleString('es-EC'),
    },
    {
      accent: brandColors.ocean,
      detail: `+${data.growth30d.newUsers} en 30 días`,
      label: 'Usuarios registrados',
      value: data.metrics.registeredUsers.toLocaleString('es-EC'),
    },
    {
      accent: brandColors.sun,
      detail: `${data.metrics.publishedReviews} reseñas publicadas`,
      label: 'Valoración media',
      value: `${formatDecimal(data.metrics.averageRating)}/5`,
    },
    {
      accent: brandColors.lime,
      detail: `+${data.growth30d.favorites} en 30 días`,
      label: 'Lugares guardados',
      value: data.metrics.favorites.toLocaleString('es-EC'),
    },
  ];
  const pendingCards: {
    accent: string;
    count: number;
    detail: string;
    label: string;
    section: DashboardSection;
  }[] = [
    {
      accent: brandColors.sun,
      count: data.pending.suggestions,
      detail: 'Propuestas por revisar',
      label: 'Sugerencias',
      section: 'suggestions',
    },
    {
      accent: brandColors.ocean,
      count: data.pending.images,
      detail: 'Fotografías en moderación',
      label: 'Fotografías',
      section: 'moderation',
    },
    {
      accent: brandColors.coral,
      count: data.pending.reports,
      detail: 'Incidencias abiertas',
      label: 'Reportes',
      section: 'reports',
    },
    {
      accent: brandColors.primary,
      count: data.pending.places,
      detail: 'Lugares sin publicar',
      label: 'Lugares pendientes',
      section: 'places',
    },
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      <SurfaceCard
        style={{
          backgroundColor: brandColors.deepTeal,
          borderColor: brandColors.deepTeal,
          gap: spacing.md,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs, minWidth: 240 }}>
            <Text style={{ ...typography.title, color: brandColors.white }}>
              Pulso de MantaViews
            </Text>
            <Text style={{ color: '#D8F1F0', lineHeight: 21 }}>
              Una vista operativa del catálogo, la comunidad y la moderación.
            </Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: radii.pill,
                flexDirection: 'row',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <View
                style={{
                  backgroundColor: isRefreshing ? brandColors.sun : '#56D39B',
                  borderRadius: 5,
                  height: 10,
                  width: 10,
                }}
              />
              <Text style={{ color: brandColors.white, fontWeight: '800' }}>
                {isRefreshing ? 'Actualizando…' : 'Datos en vivo'}
              </Text>
            </View>
            <AppButton
              disabled={isRefreshing}
              label="Actualizar ahora"
              onPress={onRefresh}
              variant="secondary"
            />
          </View>
        </View>
        <Text style={{ color: '#B8DAD9', fontSize: 12 }}>
          Última sincronización: {formatDate(data.generatedAt)}
        </Text>
      </SurfaceCard>

      <DashboardSectionHeader
        description="Indicadores generales del proyecto."
        title="Panorama general"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {primaryMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </View>

      <DashboardSectionHeader
        description="Elementos que necesitan una decisión del equipo."
        title="Pendientes de acción"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {pendingCards.map((card) => (
          <SurfaceCard
            key={card.label}
            style={{
              borderTopColor: card.accent,
              borderTopWidth: 4,
              flexBasis: 230,
              flexGrow: 1,
              minWidth: 220,
            }}
          >
            <Text style={{ color: card.accent, fontSize: 34, fontWeight: '900' }}>
              {card.count}
            </Text>
            <Text style={{ ...typography.bodyStrong, color: colors.label }}>{card.label}</Text>
            <Text style={{ ...typography.caption, color: colors.secondaryLabel }}>
              {card.detail}
            </Text>
            <AppButton
              label="Revisar"
              onPress={() => onNavigate(card.section)}
              variant="secondary"
            />
          </SurfaceCard>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <AnalyticsPanel
          description="Lugares publicados por tipo de experiencia."
          minWidth={300}
          title="Catálogo por categoría"
        >
          <BarList
            items={data.categoryBreakdown.map((category) => ({
              color: category.color,
              label: category.name,
              value: category.count,
            }))}
          />
        </AnalyticsPanel>

        <AnalyticsPanel
          description="Distribución de las valoraciones publicadas."
          minWidth={300}
          title="Calidad de reseñas"
        >
          <View style={{ gap: spacing.sm }}>
            {data.ratingDistribution.map((item) => (
              <HorizontalBar
                color={brandColors.sun}
                key={item.rating}
                label={`${item.rating} estrellas`}
                max={Math.max(...data.ratingDistribution.map((rating) => rating.count), 1)}
                value={item.count}
              />
            ))}
          </View>
          <Text style={{ color: colors.secondaryLabel }}>
            {data.growth30d.reviews} reseñas nuevas durante los últimos 30 días.
          </Text>
        </AnalyticsPanel>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <AnalyticsPanel
          description="Estado actual de las propuestas enviadas por usuarios."
          minWidth={300}
          title="Flujo de sugerencias"
        >
          <StatusBreakdown items={data.suggestionStatus} />
          <Text style={{ color: colors.secondaryLabel }}>
            {data.growth30d.suggestions} propuestas recibidas en los últimos 30 días.
          </Text>
        </AnalyticsPanel>

        <AnalyticsPanel
          description="Percepción de la comunidad sobre los lugares del catálogo."
          minWidth={300}
          title="Confianza turística"
        >
          <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md }}>
            <Text style={{ color: brandColors.primary, fontSize: 46, fontWeight: '900' }}>
              {data.metrics.touristicPercentage}%
            </Text>
            <Text style={{ ...typography.bodyStrong, color: colors.label }}>
              de votos consideran turísticos los lugares
            </Text>
            <Text style={{ color: colors.secondaryLabel }}>
              Basado en {data.metrics.touristVotes} votos registrados.
            </Text>
          </View>
        </AnalyticsPanel>
      </View>

      <AnalyticsPanel
        description="Altas y participación acumuladas en el periodo."
        minWidth={300}
        title="Actividad de los últimos 30 días"
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[
            ['Usuarios', data.growth30d.newUsers],
            ['Lugares', data.growth30d.newPlaces],
            ['Reseñas', data.growth30d.reviews],
            ['Sugerencias', data.growth30d.suggestions],
            ['Reportes', data.growth30d.reports],
            ['Guardados', data.growth30d.favorites],
          ].map(([label, value]) => (
            <View
              key={String(label)}
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.md,
                flexBasis: 140,
                flexGrow: 1,
                gap: spacing.xs,
                padding: spacing.md,
              }}
            >
              <Text style={{ color: brandColors.primary, fontSize: 26, fontWeight: '900' }}>
                {value}
              </Text>
              <Text style={{ color: colors.secondaryLabel }}>{label}</Text>
            </View>
          ))}
        </View>
      </AnalyticsPanel>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <AnalyticsPanel
          description="Distribución de todos los registros del catálogo."
          minWidth={300}
          title="Salud del catálogo"
        >
          <StatusBreakdown items={data.catalogStatus} />
        </AnalyticsPanel>

        <AnalyticsPanel
          description="Últimos cambios de catálogo, comunidad y administración."
          minWidth={300}
          title="Actividad reciente"
        >
          {data.recentActivity.length ? (
            <View style={{ gap: spacing.sm }}>
              {data.recentActivity.map((activity) => (
                <View
                  key={activity.id}
                  style={{
                    alignItems: 'flex-start',
                    borderBottomColor: colors.separator,
                    borderBottomWidth: 1,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    paddingBottom: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: activityToneColor(activity.tone),
                      borderRadius: 6,
                      height: 12,
                      marginTop: 5,
                      width: 12,
                    }}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ ...typography.bodyStrong, color: colors.label }}>
                      {activity.label}
                    </Text>
                    <Text style={{ color: colors.secondaryLabel }}>{activity.detail}</Text>
                    <Text style={{ color: colors.secondaryLabel, fontSize: 12 }}>
                      {formatDate(activity.at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.secondaryLabel }}>Aún no hay actividad registrada.</Text>
          )}
        </AnalyticsPanel>
      </View>
    </View>
  );
}

function DashboardSectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ ...typography.heading, color: colors.label }}>{title}</Text>
      <Text style={{ color: colors.secondaryLabel }}>{description}</Text>
    </View>
  );
}

function MetricCard({
  accent,
  detail,
  label,
  value,
}: {
  accent: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <SurfaceCard
      style={{
        borderLeftColor: accent,
        borderLeftWidth: 5,
        flexBasis: 230,
        flexGrow: 1,
        minWidth: 220,
      }}
    >
      <Text style={{ color: accent, fontSize: 34, fontWeight: '900' }}>{value}</Text>
      <Text style={{ ...typography.bodyStrong, color: colors.label }}>{label}</Text>
      <Text style={{ ...typography.caption, color: colors.secondaryLabel }}>{detail}</Text>
    </SurfaceCard>
  );
}

function AnalyticsPanel({
  children,
  description,
  minWidth,
  title,
}: {
  children: React.ReactNode;
  description: string;
  minWidth: number;
  title: string;
}) {
  return (
    <SurfaceCard style={{ flexBasis: minWidth, flexGrow: 1, minWidth }}>
      <Text style={{ ...typography.heading, color: colors.label }}>{title}</Text>
      <Text style={{ color: colors.secondaryLabel }}>{description}</Text>
      <View style={{ gap: spacing.md, marginTop: spacing.xs }}>{children}</View>
    </SurfaceCard>
  );
}

function BarList({ items }: { items: { color: string; label: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <HorizontalBar
          color={item.color}
          key={item.label}
          label={item.label}
          max={max}
          value={item.value}
        />
      ))}
    </View>
  );
}

function HorizontalBar({
  color,
  label,
  max,
  value,
}: {
  color: string;
  label: string;
  max: number;
  value: number;
}) {
  const width = `${Math.max(4, Math.round((value / max) * 100))}%` as const;
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text style={{ color: colors.label, flex: 1 }}>{label}</Text>
        <Text style={{ color: colors.secondaryLabel, fontWeight: '800' }}>{value}</Text>
      </View>
      <View
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: radii.pill,
          height: 9,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            backgroundColor: color,
            borderRadius: radii.pill,
            height: '100%',
            width,
          }}
        />
      </View>
    </View>
  );
}

function StatusBreakdown({ items }: { items: { count: number; status: ContentStatus }[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: radii.pill,
          flexDirection: 'row',
          height: 16,
          overflow: 'hidden',
        }}
      >
        {items
          .filter((item) => item.count > 0)
          .map((item) => (
            <View
              key={item.status}
              style={{
                backgroundColor: statusColor(item.status),
                flexGrow: item.count,
                flexShrink: 1,
              }}
            />
          ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {items.map((item) => (
          <View key={item.status} style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
            <View
              style={{
                backgroundColor: statusColor(item.status),
                borderRadius: 5,
                height: 10,
                width: 10,
              }}
            />
            <Text style={{ color: colors.secondaryLabel }}>
              {statusLabel(item.status)}: {item.count}
              {total ? ` (${Math.round((item.count / total) * 100)}%)` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function statusLabel(status: ContentStatus) {
  return {
    archived: 'Archivado',
    pending: 'Pendiente',
    published: 'Publicado',
    rejected: 'Rechazado',
  }[status];
}

function statusColor(status: ContentStatus) {
  return {
    archived: brandColors.muted,
    pending: brandColors.sun,
    published: brandColors.primary,
    rejected: brandColors.coral,
  }[status];
}

function activityToneColor(tone: AdminDashboardData['recentActivity'][number]['tone']) {
  return {
    admin: brandColors.deepTeal,
    alert: brandColors.coral,
    catalog: brandColors.primary,
    community: brandColors.ocean,
    moderation: brandColors.sun,
  }[tone];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}
