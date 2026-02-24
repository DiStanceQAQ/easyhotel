import { Image } from 'expo-image';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

type HotelCardProps = {
  id: string;
  nameCn: string;
  nameEn: string;
  star: number;
  city: string;
  address: string;
  distanceMeters: number | null;
  coverImage: string | null;
  minPrice: number | null;
  description: string | null;
  tags: string[];
  onPressHotel: (hotelId: string) => void;
};

function HotelCardBase({
  id,
  nameCn,
  nameEn,
  star,
  city,
  address,
  distanceMeters,
  coverImage,
  minPrice,
  description,
  tags,
  onPressHotel,
}: HotelCardProps) {
  const handlePress = useCallback(() => {
    onPressHotel(id);
  }, [id, onPressHotel]);

  const scoreLabel = useMemo(() => (4.1 + Math.min(star, 5) * 0.12).toFixed(1), [star]);
  const reviewLabel = useMemo(() => Math.round((star + 3) * 170), [star]);
  const collectLabel = useMemo(() => Math.round((star + 2) * 1362), [star]);
  const diamonds = useMemo(() => '◆'.repeat(Math.max(1, Math.min(star, 5))), [star]);

  const distanceLabel = useMemo(() => {
    if (typeof distanceMeters === 'number' && Number.isFinite(distanceMeters)) {
      if (distanceMeters < 1000) {
        return `距您直线${Math.max(1, Math.round(distanceMeters))}米`;
      }

      const km = distanceMeters / 1000;
      const digits = km >= 10 ? 0 : 1;
      return `距您直线${km.toFixed(digits)}公里`;
    }

    return city;
  }, [city, distanceMeters]);

  const recommendText = useMemo(() => {
    if (description && description.trim().length > 0) {
      return description.trim();
    }

    if (tags.length > 0) {
      return `${tags.slice(0, 2).join('，')}，交通便利`;
    }

    return '服务满分，楼下就有停车位';
  }, [description, tags]);

  const oldPrice = typeof minPrice === 'number' ? minPrice + 66 : null;

  return (
    <Pressable testID="hotel-card" onPress={handlePress} style={styles.card}>
      <Image
        source={{
          uri:
            coverImage ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
        }}
        style={styles.cover}
        contentFit="cover"
        transition={180}
      />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {nameCn}
          </Text>
          <Text style={styles.diamond}>{diamonds}</Text>
        </View>
        {nameEn ? (
          <Text style={styles.nameEn} numberOfLines={1}>
            {nameEn}
          </Text>
        ) : null}

        <View style={styles.ratingRow}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{scoreLabel}</Text>
          </View>
          <Text style={styles.qualityText}>超棒</Text>
          <Text style={styles.reviewText}>{`${reviewLabel}点评 · ${collectLabel}收藏`}</Text>
        </View>

        <Text style={styles.distanceText} numberOfLines={1}>{`${distanceLabel} · ${address}`}</Text>
        <Text style={styles.recommendText} numberOfLines={1}>
          {recommendText}
        </Text>

        <View style={styles.tagRow}>
          {tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.brandText} numberOfLines={1}>
            {nameEn || city}
          </Text>

          <View style={styles.priceWrap}>
            {oldPrice ? <Text style={styles.oldPrice}>{`¥${oldPrice}`}</Text> : null}
            <View style={styles.priceRow}>
              <Text style={styles.pricePrefix}>¥</Text>
              <Text style={styles.priceValue}>{minPrice ?? '--'}</Text>
              <Text style={styles.priceSuffix}>起</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const HotelCard = memo(HotelCardBase);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
    paddingBottom: spacing.sm,
    flexDirection: 'row',
  },
  cover: {
    width: 116,
    height: 154,
    borderRadius: 10,
    backgroundColor: '#e6edf8',
  },
  body: {
    flex: 1,
    paddingLeft: spacing.sm,
    minHeight: 154,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameEn: {
    marginTop: 2,
    color: '#7a8ea8',
    fontSize: 10,
    lineHeight: 14,
  },
  name: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
    color: '#16273f',
    fontWeight: '800',
  },
  diamond: {
    color: '#f2a523',
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreBadge: {
    borderRadius: 4,
    backgroundColor: '#1f68ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scoreText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  qualityText: {
    color: '#1f68ff',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewText: {
    color: '#596e8b',
    fontSize: 11,
  },
  distanceText: {
    marginTop: 6,
    color: '#344f77',
    fontSize: 13,
    lineHeight: 18,
  },
  recommendText: {
    marginTop: 2,
    color: '#2f4a74',
    fontSize: 13,
    lineHeight: 18,
  },
  tagRow: {
    marginTop: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    borderRadius: radius.sm,
    backgroundColor: '#f2f5fa',
    borderWidth: 1,
    borderColor: '#e4ebf5',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tagText: {
    color: '#5a6f8d',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  brandText: {
    flex: 1,
    color: '#6f819a',
    fontSize: 10,
    marginRight: spacing.xs,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  oldPrice: {
    color: '#8b9ab0',
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pricePrefix: {
    color: '#1f68ff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  priceValue: {
    color: '#1f68ff',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '800',
  },
  priceSuffix: {
    marginLeft: 2,
    color: '#1f68ff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 1,
  },
});
