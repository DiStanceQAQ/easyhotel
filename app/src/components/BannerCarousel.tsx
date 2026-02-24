import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BannerItem } from '../types/api';
import { colors, radius, spacing } from '../theme/tokens';

const BANNER_HEIGHT = 226;

type BannerCarouselProps = {
  data: BannerItem[];
  onPressBanner: (hotelId: string) => void;
};

export function BannerCarousel({ data, onPressBanner }: BannerCarouselProps) {
  const { width } = useWindowDimensions();
  const bannerWidth = Math.max(1, Math.round(width));
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<BannerItem> | null>(null);
  const activeIndexRef = useRef(0);

  const onViewableItemsChanged = useMemo(
    () =>
      ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
        const index = viewableItems[0]?.index;
        if (typeof index === 'number') {
          setActiveIndex(index);
          activeIndexRef.current = index;
        }
      },
    [],
  );

  useEffect(() => {
    if (data.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % data.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 5200);

    return () => {
      clearInterval(timer);
    };
  }, [data.length]);

  useEffect(() => {
    if (data.length <= 0) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(activeIndexRef.current, data.length - 1));
    activeIndexRef.current = safeIndex;
    setActiveIndex(safeIndex);
    listRef.current?.scrollToOffset({
      offset: safeIndex * bannerWidth,
      animated: false,
    });
  }, [bannerWidth, data.length]);

  const getItemLayout = useCallback(
    (_: ArrayLike<BannerItem> | null | undefined, index: number) => ({
      length: bannerWidth,
      offset: bannerWidth * index,
      index,
    }),
    [bannerWidth],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BannerItem>) => (
      <Pressable
        style={[styles.slide, { width: bannerWidth }]}
        onPress={() => {
          onPressBanner(item.hotelId);
        }}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(5, 18, 39, 0.08)', 'rgba(5, 18, 39, 0.38)', 'rgba(5, 18, 39, 0.72)']}
          style={[styles.overlay, { height: BANNER_HEIGHT }]}
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title ?? '当季精选酒店'}
          </Text>
        </View>
      </Pressable>
    ),
    [bannerWidth, onPressBanner],
  );

  const keyExtractor = useCallback((item: BannerItem) => `${item.id}`, []);

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={bannerWidth}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({
            offset: index * bannerWidth,
            animated: true,
          });
        }}
        contentContainerStyle={styles.listContent}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        onViewableItemsChanged={onViewableItemsChanged}
      />
      <View style={styles.dots}>
        {data.map((item, index) => (
          <View
            key={item.id}
            style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 0,
    gap: 0,
  },
  slide: {
    height: BANNER_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#d9e6ff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  content: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.36)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  dots: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#fcfcfcff',
  },
});
