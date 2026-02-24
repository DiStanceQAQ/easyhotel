import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { spacing } from '../../../theme/tokens';
import { HotelImageItem } from '../../../types/api';
import { hotelDetailStyles as styles } from '../styles';
import { normalizeRemoteMediaUrl } from '../utils';

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80';

type Props = {
  images: HotelImageItem[];
  onBack?: () => void;
  topInset?: number;
};

export function DetailHeroCarousel({ images, onBack, topInset = 0 }: Props) {
  const { width } = useWindowDimensions();
  const heroWidth = Math.max(1, Math.round(width));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadErrorMap, setImageLoadErrorMap] = useState<Record<number, true>>({});
  const listRef = useRef<FlatList<HotelImageItem> | null>(null);

  const displayImages = useMemo(() => {
    const normalized = images
      .map((item) => {
        const normalizedUrl = normalizeRemoteMediaUrl(item.url);
        if (!normalizedUrl) {
          return null;
        }

        return {
          ...item,
          url: normalizedUrl,
        };
      })
      .filter((item): item is HotelImageItem => item != null);

    if (normalized.length > 0) {
      return normalized;
    }

    return [{ id: -1, url: HERO_FALLBACK_IMAGE, sortOrder: 0 }];
  }, [images]);

  const onImageError = useCallback((id: number) => {
    setImageLoadErrorMap((current) => {
      if (current[id]) {
        return current;
      }
      return {
        ...current,
        [id]: true,
      };
    });
  }, []);

  const renderImage: ListRenderItem<HotelImageItem> = useCallback(
    ({ item }) => {
      if (imageLoadErrorMap[item.id]) {
        return (
          <View style={[styles.bannerImageFallback, { width: heroWidth }]}>
            <Text style={styles.bannerFallbackText}>暂无酒店图片</Text>
          </View>
        );
      }

      return (
        <Image
          source={{ uri: item.url }}
          style={[styles.bannerImage, { width: heroWidth }]}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          onError={() => onImageError(item.id)}
        />
      );
    },
    [heroWidth, imageLoadErrorMap, onImageError],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<HotelImageItem> | null | undefined, index: number) => ({
      length: heroWidth,
      offset: heroWidth * index,
      index,
    }),
    [heroWidth],
  );

  const onMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (displayImages.length <= 0) {
        return;
      }

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
      const safeIndex = Math.max(0, Math.min(nextIndex, displayImages.length - 1));
      setActiveImageIndex(safeIndex);
    },
    [displayImages.length, heroWidth],
  );

  useEffect(() => {
    if (displayImages.length <= 0) {
      setActiveImageIndex(0);
      return;
    }

    const maxIndex = displayImages.length - 1;
    if (activeImageIndex > maxIndex) {
      setActiveImageIndex(maxIndex);
      listRef.current?.scrollToOffset({ offset: maxIndex * heroWidth, animated: false });
      return;
    }

    listRef.current?.scrollToOffset({
      offset: activeImageIndex * heroWidth,
      animated: false,
    });
  }, [activeImageIndex, displayImages.length, heroWidth]);

  return (
    <View style={styles.heroWrap}>
      <FlatList
        ref={listRef}
        data={displayImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderImage}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({
            offset: index * heroWidth,
            animated: true,
          });
        }}
      />

      <LinearGradient
        colors={['rgba(18,28,44,0.5)', 'rgba(18,28,44,0.15)', 'rgba(18,28,44,0.5)']}
        style={styles.heroMask}
      />

      {onBack ? (
        <View style={[styles.topActions, { top: spacing.sm + topInset }]}>
          <Pressable onPress={onBack} style={styles.topIconCircle}>
            <Text style={styles.topBack}>{'‹'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.previewCountBadge}>
        <Text style={styles.previewCountText}>
          {`${activeImageIndex + 1}/${displayImages.length}`}
        </Text>
      </View>
    </View>
  );
}
