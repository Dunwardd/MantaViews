import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, Share, Text, View } from 'react-native';

import { AuthNotice } from '@/components/auth/auth-notice';
import { PlaceCover } from '@/components/places/place-cover';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { FeedbackState, LoadingState } from '@/components/ui/feedback-state';
import { RatingDisplay } from '@/components/ui/rating-display';
import { StatusCard } from '@/components/ui/status-card';
import { AppInput } from '@/components/ui/app-input';
import { FilterChip } from '@/components/ui/filter-chip';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuth } from '@/providers/auth-provider';
import { useLocale } from '@/providers/locale-provider';
import { getPlaceDetail } from '@/services/catalog/place-service';
import {
  archiveReview,
  createReport,
  getFavoritePlaceIds,
  getOwnReview,
  getOwnTouristVote,
  saveReview,
  saveTouristVote,
  setFavorite,
} from '@/services/community/community-service';
import { getPublishedReviews } from '@/services/reviews/review-service';
import { uploadPendingPlaceImage } from '@/services/storage/image-service';
import { pickCompressedImage } from '@/services/storage/media-picker';
import { brandColors, colors, layout, spacing } from '@/theme';

type PlaceDetailScreenProps = {
  placeId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function PlaceDetailScreen({ placeId }: PlaceDetailScreenProps) {
  const { locale, t } = useLocale();
  const reportReasons = [
    ['incorrect_information', t('detail.reportIncorrect')],
    ['duplicate', t('detail.reportDuplicate')],
    ['inappropriate', t('detail.reportInappropriate')],
    ['spam', t('detail.reportSpam')],
    ['other', t('detail.reportOther')],
  ] as const;
  const { user } = useAuth();
  const guard = useAuthGuard();
  const queryClient = useQueryClient();
  const returnTo = (placeId ? `/place/${placeId}` : '/(tabs)') as Href;
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [photoAltText, setPhotoAltText] = useState(() => t('detail.defaultPhotoDescription'));
  const [reportDetails, setReportDetails] = useState('');
  const [reportReason, setReportReason] = useState<
    'incorrect_information' | 'duplicate' | 'inappropriate' | 'spam' | 'other'
  >('incorrect_information');
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
  const favoriteIdsQuery = useQuery({
    enabled: Boolean(user?.id),
    queryFn: () => getFavoritePlaceIds(user!.id),
    queryKey: ['private', 'favorite-ids', user?.id],
  });
  const ownReviewQuery = useQuery({
    enabled: Boolean(user?.id && hasValidId),
    queryFn: () => getOwnReview(user!.id, placeId as string),
    queryKey: ['private', 'own-review', user?.id, placeId],
  });
  const voteQuery = useQuery({
    enabled: Boolean(user?.id && hasValidId),
    queryFn: () => getOwnTouristVote(user!.id, placeId as string),
    queryKey: ['private', 'tourist-vote', user?.id, placeId],
  });

  useEffect(() => {
    if (ownReviewQuery.data) {
      setReviewRating(ownReviewQuery.data.rating);
      setReviewComment(ownReviewQuery.data.comment);
    }
  }, [ownReviewQuery.data]);

  const refreshCommunityData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['public', 'place-detail', locale, placeId] }),
      queryClient.invalidateQueries({ queryKey: ['public', 'reviews', placeId] }),
    ]);
  };
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      const isFavorite = favoriteIdsQuery.data?.includes(placeId) ?? false;
      await setFavorite(user.id, placeId, !isFavorite);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['private', 'favorite-ids', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['private', 'favorites', user?.id] }),
        refreshCommunityData(),
      ]);
    },
  });
  const voteMutation = useMutation({
    mutationFn: async (isTouristic: boolean) => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      await saveTouristVote(user.id, placeId, isTouristic);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['private', 'tourist-vote', user?.id, placeId] }),
        refreshCommunityData(),
      ]);
    },
  });
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      if (reviewComment.trim().length < 3) throw new Error(t('detail.commentLength'));
      return saveReview(user.id, placeId, { comment: reviewComment, rating: reviewRating });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['private', 'own-review', user?.id, placeId],
      });
      await refreshCommunityData();
    },
  });
  const archiveReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      await archiveReview(user.id, placeId);
    },
    onSuccess: async () => {
      setReviewComment('');
      await queryClient.invalidateQueries({
        queryKey: ['private', 'own-review', user?.id, placeId],
      });
      await refreshCommunityData();
    },
  });
  const photoMutation = useMutation({
    mutationFn: async () => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      if (photoAltText.trim().length < 3) throw new Error(t('detail.photoDescriptionRequired'));
      const image = await pickCompressedImage();
      if (!image) return null;
      return uploadPendingPlaceImage({
        ...image,
        altText: photoAltText,
        placeId,
        reviewId: ownReviewQuery.data?.id,
        userId: user.id,
      });
    },
  });
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user || !placeId) throw new Error(t('detail.sessionRequired'));
      if (reportDetails && reportDetails.trim().length < 3)
        throw new Error(t('detail.reportDetailsRequired'));
      await createReport(user.id, {
        details: reportDetails,
        reason: reportReason,
        targetId: placeId,
        targetType: 'place',
      });
    },
    onSuccess: () => setReportDetails(''),
  });

  const openExternalUrl = async (url: string) => {
    setActionNotice(null);
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsafe protocol');
      await Linking.openURL(parsedUrl.toString());
    } catch {
      setActionNotice({
        message: t('detail.openLinkError'),
        tone: 'error',
      });
    }
  };

  const callPhone = async (phone: string) => {
    setActionNotice(null);
    const safeNumber = phone.replace(/[^+\d]/g, '');
    if (safeNumber.length < 7) {
      setActionNotice({ message: t('detail.invalidPhone'), tone: 'error' });
      return;
    }
    try {
      await Linking.openURL(`tel:${safeNumber}`);
    } catch {
      setActionNotice({ message: t('detail.callError'), tone: 'error' });
    }
  };

  if (!hasValidId) {
    return (
      <PageState title={t('detail.invalidTitle')} description={t('detail.invalidDescription')} />
    );
  }

  if (detailQuery.isPending) {
    return <PageLoading label={t('detail.loading')} />;
  }

  if (detailQuery.isError) {
    return (
      <PageContainer>
        <FeedbackState
          actionLabel={t('common.retry')}
          description={t('detail.fetchErrorDescription')}
          onAction={() => void detailQuery.refetch()}
          title={t('detail.fetchErrorTitle')}
          tone="error"
        />
      </PageContainer>
    );
  }

  const place = detailQuery.data;
  if (!place) {
    return (
      <PageState title={t('detail.notFoundTitle')} description={t('detail.notFoundDescription')} />
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
          setActionNotice({ message: t('detail.shareCopied'), tone: 'success' });
        } else {
          throw new Error('Share unavailable');
        }
      } else {
        await Share.share({ message, title: place.name });
      }
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      setActionNotice({ message: t('detail.shareError'), tone: 'error' });
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
            {place.isFeatured ? <Badge label={t('places.featured')} /> : null}
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
        <MetricCard
          label={t('detail.rating')}
          value={`${place.stats.averageRating.toFixed(1)} / 5`}
        />
        <MetricCard label={t('detail.reviews')} value={String(place.stats.reviewCount)} />
        <MetricCard label={t('detail.favorites')} value={String(place.stats.favoriteCount)} />
        <MetricCard
          label={t('detail.touristic')}
          value={`${place.stats.touristicPercentage.toFixed(0)}%`}
        />
      </View>

      <InformationSection title={t('detail.community')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <View style={{ flexGrow: 1, minWidth: 180 }}>
            <AppButton
              label={
                favoriteIdsQuery.data?.includes(place.id)
                  ? t('detail.removeFavorite')
                  : t('detail.addFavorite')
              }
              loading={favoriteMutation.isPending}
              onPress={() => guard(() => favoriteMutation.mutate(), returnTo)}
              variant="secondary"
            />
          </View>
          <FilterChip
            color={brandColors.lime}
            label={t('detail.touristic')}
            onPress={() => guard(() => voteMutation.mutate(true), returnTo)}
            selected={voteQuery.data === true}
          />
          <FilterChip
            color={colors.error}
            label={t('detail.notTouristic')}
            onPress={() => guard(() => voteMutation.mutate(false), returnTo)}
            selected={voteQuery.data === false}
          />
        </View>
        {favoriteMutation.error || voteMutation.error ? (
          <AuthNotice message={t('detail.actionError')} />
        ) : null}
      </InformationSection>

      <InformationSection title={t('detail.yourReview')}>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14 }}>
          {t('detail.reviewHelp')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <FilterChip
              color={brandColors.sun}
              key={rating}
              label={`${rating} ★`}
              onPress={() => setReviewRating(rating)}
              selected={reviewRating === rating}
            />
          ))}
        </View>
        <AppInput
          label={t('detail.comment')}
          maxLength={1000}
          multiline
          onChangeText={setReviewComment}
          placeholder={t('detail.commentPlaceholder')}
          value={reviewComment}
        />
        {reviewMutation.isSuccess ? (
          <AuthNotice message={t('detail.reviewSaved')} tone="success" />
        ) : null}
        {reviewMutation.error ? (
          <AuthNotice message={(reviewMutation.error as Error).message} />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <View style={{ flexGrow: 1, minWidth: 170 }}>
            <AppButton
              label={ownReviewQuery.data ? t('detail.updateReview') : t('detail.publishReview')}
              loading={reviewMutation.isPending}
              onPress={() => guard(() => reviewMutation.mutate(), returnTo)}
            />
          </View>
          {ownReviewQuery.data?.status === 'published' ? (
            <View style={{ flexGrow: 1, minWidth: 150 }}>
              <AppButton
                label={t('detail.archiveReview')}
                loading={archiveReviewMutation.isPending}
                onPress={() => archiveReviewMutation.mutate()}
                variant="danger"
              />
            </View>
          ) : null}
        </View>
      </InformationSection>

      <InformationSection title={t('detail.sharePhoto')}>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14 }}>
          {t('detail.photoHelp')}
        </Text>
        <AppInput
          label={t('detail.photoDescription')}
          maxLength={180}
          onChangeText={setPhotoAltText}
          value={photoAltText}
        />
        {photoMutation.data ? <AuthNotice message={t('detail.photoSent')} tone="success" /> : null}
        {photoMutation.error ? (
          <AuthNotice message={(photoMutation.error as Error).message} />
        ) : null}
        <AppButton
          label={t('detail.selectPhoto')}
          loading={photoMutation.isPending}
          onPress={() => guard(() => photoMutation.mutate(), returnTo)}
          variant="secondary"
        />
      </InformationSection>

      <InformationSection title={t('detail.about')}>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 15, lineHeight: 24 }}>
          {place.description}
        </Text>
      </InformationSection>

      <InformationSection title={t('detail.visitInformation')}>
        <InformationRow label={t('detail.address')} value={place.address} />
        <InformationRow
          label={t('detail.coordinates')}
          value={`${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`}
        />
        <InformationRow label={t('detail.price')} value={formatPriceLevel(place.priceLevel, t)} />
        <InformationRow
          label={t('detail.schedule')}
          value={
            hasOpeningHours ? formatOpeningHours(place.openingHours) : t('detail.scheduleUnknown')
          }
        />
        <InformationRow label={t('detail.phone')} value={place.phone ?? t('detail.unavailable')} />
        <InformationRow
          label={t('detail.website')}
          value={place.websiteUrl ?? t('detail.unavailable')}
        />
      </InformationSection>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flexGrow: 1, minWidth: 220 }}>
          <AppButton
            label={t('detail.googleRoute')}
            onPress={() => void openExternalUrl(mapsUrl)}
          />
        </View>
        {place.phone ? (
          <View style={{ flexGrow: 1, minWidth: 160 }}>
            <AppButton
              label={t('detail.call')}
              onPress={() => void callPhone(place.phone as string)}
              variant="secondary"
            />
          </View>
        ) : null}
        {place.websiteUrl ? (
          <View style={{ flexGrow: 1, minWidth: 180 }}>
            <AppButton
              label={t('detail.visitWebsite')}
              onPress={() => void openExternalUrl(place.websiteUrl as string)}
              variant="secondary"
            />
          </View>
        ) : null}
        <View style={{ flexGrow: 1, minWidth: 180 }}>
          <AppButton
            label={t('detail.sharePlace')}
            onPress={() => void sharePlace()}
            variant="secondary"
          />
        </View>
      </View>
      {actionNotice ? <AuthNotice message={actionNotice.message} tone={actionNotice.tone} /> : null}

      <InformationSection title={t('detail.gallery')}>
        {visibleGallery.length === 0 ? (
          <FeedbackState
            description={t('detail.galleryEmptyDescription')}
            title={t('detail.galleryEmptyTitle')}
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
                  accessibilityLabel={image.altText || `${t('places.photo')} ${place.name}`}
                  accessibilityRole="image"
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

      <InformationSection title={t('detail.visitorOpinions')}>
        {reviewsQuery.isPending ? (
          <LoadingState label={t('detail.reviewsLoading')} />
        ) : reviewsQuery.isError ? (
          <FeedbackState
            actionLabel={t('common.retry')}
            description={t('detail.reviewsErrorDescription')}
            onAction={() => void reviewsQuery.refetch()}
            title={t('detail.reviewsErrorTitle')}
            tone="error"
          />
        ) : reviewsQuery.data.length === 0 ? (
          <FeedbackState
            description={t('detail.reviewsEmptyDescription')}
            title={t('detail.reviewsEmptyTitle')}
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
                  {review.comment || t('detail.reviewWithoutComment')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </InformationSection>

      <InformationSection title={t('detail.report')}>
        <Text selectable style={{ color: colors.secondaryLabel, fontSize: 14 }}>
          {t('detail.reportHelp')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {reportReasons.map(([reason, label]) => (
            <FilterChip
              key={reason}
              label={label}
              onPress={() => setReportReason(reason)}
              selected={reportReason === reason}
            />
          ))}
        </View>
        <AppInput
          label={t('detail.reportDetails')}
          maxLength={500}
          multiline
          onChangeText={setReportDetails}
          value={reportDetails}
        />
        {reportMutation.isSuccess ? (
          <AuthNotice message={t('detail.reportSent')} tone="success" />
        ) : null}
        {reportMutation.error ? (
          <AuthNotice message={(reportMutation.error as Error).message} />
        ) : null}
        <AppButton
          label={t('detail.sendReport')}
          loading={reportMutation.isPending}
          onPress={() => guard(() => reportMutation.mutate(), returnTo)}
          variant="secondary"
        />
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

function formatPriceLevel(priceLevel: number | null, t: ReturnType<typeof useLocale>['t']) {
  if (priceLevel === null) return t('detail.priceUnknown');
  if (priceLevel === 0) return t('detail.priceFree');
  return '$'.repeat(Math.max(1, Math.min(priceLevel, 4)));
}

function formatOpeningHours(openingHours: Record<string, unknown>) {
  return Object.entries(openingHours)
    .map(([day, hours]) => `${day}: ${String(hours)}`)
    .join('\n');
}
