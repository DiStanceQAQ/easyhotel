import { useQuery } from '@tanstack/react-query';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { DateData } from 'react-native-calendars';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppErrorState } from '../components/AppErrorState';
import { AppLoading } from '../components/AppLoading';
import { RoomCard } from '../components/RoomCard';
import { useSearchFilters } from '../hooks/useSearchFilters';
import { RootStackParamList } from '../navigation/types';
import { fetchHotelDetail, fetchHotelPriceCalendar, fetchHotelRooms } from '../services/appApi';
import { ApiError } from '../services/http';
import { queryKeys } from '../services/queryKeys';
import { useSearchStore } from '../store/searchStore';
import { spacing } from '../theme/tokens';
import { HotelImageItem, RoomItem } from '../types/api';
import { getNightCount, isDateRangeValid } from '../utils/date';
import { DetailBottomBar } from './hotel-detail/components/DetailBottomBar';
import { DetailHeroCarousel } from './hotel-detail/components/DetailHeroCarousel';
import { DetailInfoCard } from './hotel-detail/components/DetailInfoCard';
import { LowPriceCalendarSheet } from './hotel-detail/components/LowPriceCalendarSheet';
import { useRoomSelection } from './hotel-detail/hooks/useRoomSelection';
import { hotelDetailStyles as styles } from './hotel-detail/styles';
import { GuestSheet } from './search/components/GuestSheet';
import { searchStyles as searchSheetStyles } from './search/styles';
import { getFacilityLabels, normalizeRemoteMediaUrl } from './hotel-detail/utils';
import { buildMarkedDates, getTodayDateString } from './search/utils';
import { getNextGuestCount, selectDateRange } from './shared/filter-utils';

type Props = NativeStackScreenProps<RootStackParamList, 'HotelDetail'>;
const LOW_PRICE_CALENDAR_DAYS = 420;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
const EMPTY_ROOMS: RoomItem[] = [];

function toDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateHint(checkIn?: string, checkOut?: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toRelativeLabel = (dateString?: string) => {
    const date = toDate(dateString);
    if (!date) {
      return '--';
    }

    const diff = Math.round((date.getTime() - today.getTime()) / DAY_MS);
    if (diff === 0) {
      return '今天';
    }
    if (diff === 1) {
      return '明天';
    }
    if (diff === 2) {
      return '后天';
    }
    return WEEK_LABELS[date.getDay()];
  };

  return `${toRelativeLabel(checkIn)} - ${toRelativeLabel(checkOut)}`;
}

function calculateDistanceMeters(
  userLat?: number,
  userLng?: number,
  hotelLat?: number | null,
  hotelLng?: number | null,
): number | null {
  if (
    typeof userLat !== 'number' ||
    typeof userLng !== 'number' ||
    typeof hotelLat !== 'number' ||
    typeof hotelLng !== 'number'
  ) {
    return null;
  }

  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(hotelLat);
  const deltaLat = toRadians(hotelLat - userLat);
  const deltaLng = toRadians(hotelLng - userLng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

export function HotelDetailScreen({ route, navigation }: Props) {
  const { hotelId } = route.params;
  const filters = useSearchFilters();
  const insets = useSafeAreaInsets();
  const setDates = useSearchStore((state) => state.setDates);
  const setGuestCounts = useSearchStore((state) => state.setGuestCounts);

  const [lowPriceVisible, setLowPriceVisible] = useState(false);
  const [guestVisible, setGuestVisible] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<string | undefined>(filters.checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<string | undefined>(filters.checkOut);
  const [draftRoomCount, setDraftRoomCount] = useState(filters.roomCount);
  const [draftAdultCount, setDraftAdultCount] = useState(filters.adultCount);
  const [draftChildCount, setDraftChildCount] = useState(filters.childCount);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const bookingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todayDate = useMemo(() => getTodayDateString(), []);

  const detailQuery = useQuery({
    queryKey: queryKeys.hotelDetail(hotelId),
    queryFn: () => fetchHotelDetail(hotelId),
  });

  const roomsQuery = useQuery({
    queryKey: queryKeys.rooms(
      hotelId,
      `${filters.checkIn ?? ''}_${filters.checkOut ?? ''}_${filters.adultCount}_${filters.childCount}`,
    ),
    queryFn: () => fetchHotelRooms(hotelId, filters),
    enabled: detailQuery.isSuccess,
  });
  const priceCalendarQuery = useQuery({
    queryKey: queryKeys.roomPriceCalendar(hotelId, todayDate, LOW_PRICE_CALENDAR_DAYS),
    queryFn: () => fetchHotelPriceCalendar(hotelId, todayDate, LOW_PRICE_CALENDAR_DAYS),
    enabled: detailQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
  });
  const hotelTitle = detailQuery.data?.nameCn?.trim() || '酒店详情';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: hotelTitle,
    });
  }, [hotelTitle, navigation]);

  useEffect(() => {
    if (!detailQuery.isError) {
      return;
    }

    const error = detailQuery.error;
    if (error instanceof ApiError && error.code === 40400) {
      Alert.alert('酒店不可见', '酒店已下线或未通过审核', [
        {
          text: '返回列表',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    }
  }, [detailQuery.error, detailQuery.isError, navigation]);

  const images = useMemo(() => {
    if (!detailQuery.data) {
      return [];
    }

    const detailImages = (Array.isArray(detailQuery.data.images) ? detailQuery.data.images : [])
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

    const normalizedCoverImage = normalizeRemoteMediaUrl(detailQuery.data.coverImage);
    if (normalizedCoverImage) {
      const hasCoverImage = detailImages.some((item) => item.url === normalizedCoverImage);
      if (!hasCoverImage) {
        detailImages.unshift({
          id: -1000,
          url: normalizedCoverImage,
          sortOrder: -1,
        });
      }
    }

    return detailImages;
  }, [detailQuery.data]);

  const markedDates = useMemo(
    () => (lowPriceVisible ? buildMarkedDates(tempCheckIn, tempCheckOut) : {}),
    [lowPriceVisible, tempCheckIn, tempCheckOut],
  );
  const tempNightCount = getNightCount(tempCheckIn, tempCheckOut);
  const canConfirmDate = isDateRangeValid(tempCheckIn, tempCheckOut);

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: 104 + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );

  const bottomBarStyle = useMemo(
    () => [
      styles.bottomBar,
      {
        paddingBottom: spacing.xs + Math.max(insets.bottom, spacing.xs),
      },
    ],
    [insets.bottom],
  );
  const roomGuestSheetStyle = useMemo(
    () => [
      searchSheetStyles.roomGuestSheet,
      {
        paddingBottom: spacing.md + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );
  const rooms = roomsQuery.data ?? EMPTY_ROOMS;
  const nightCount = getNightCount(filters.checkIn, filters.checkOut);
  const roomSelectionState = useRoomSelection({
    rooms,
    roomTarget: filters.roomCount,
    guestTarget: filters.adultCount + filters.childCount,
    nightCount,
  });
  const {
    roomSelection,
    roomMaxById,
    increaseHandlers,
    decreaseHandlers,
    selectedRoomCount,
    roomGap,
    capacityGap,
    selectedTotalPrice,
    canSubmitMixBooking,
    bookingSummaryText,
    bookingHintText,
  } = roomSelectionState;
  const lowPriceMap = useMemo(
    () =>
      (priceCalendarQuery.data?.list ?? []).reduce<Record<string, { price: number; low: boolean }>>(
        (result, item) => {
          if (item.minPrice != null) {
            result[item.date] = {
              price: item.minPrice,
              low: item.low,
            };
          }
          return result;
        },
        {},
      ),
    [priceCalendarQuery.data?.list],
  );

  useEffect(() => {
    if (lowPriceVisible) {
      return;
    }
    setTempCheckIn(filters.checkIn);
    setTempCheckOut(filters.checkOut);
  }, [filters.checkIn, filters.checkOut, lowPriceVisible]);
  useEffect(() => {
    if (guestVisible) {
      return;
    }
    setDraftRoomCount(filters.roomCount);
    setDraftAdultCount(filters.adultCount);
    setDraftChildCount(filters.childCount);
  }, [filters.adultCount, filters.childCount, filters.roomCount, guestVisible]);
  useEffect(
    () => () => {
      if (bookingTimerRef.current) {
        clearTimeout(bookingTimerRef.current);
      }
    },
    [],
  );

  const onOpenLowPriceCalendar = useCallback(() => {
    setGuestVisible(false);
    setTempCheckIn(filters.checkIn);
    setTempCheckOut(filters.checkOut);
    setLowPriceVisible(true);
  }, [filters.checkIn, filters.checkOut]);
  const onOpenGuestEditor = useCallback(() => {
    setLowPriceVisible(false);
    setDraftRoomCount(filters.roomCount);
    setDraftAdultCount(filters.adultCount);
    setDraftChildCount(filters.childCount);
    setGuestVisible(true);
  }, [filters.adultCount, filters.childCount, filters.roomCount]);
  const onUpdateGuest = useCallback((type: 'room' | 'adult' | 'child', delta: 1 | -1) => {
    if (type === 'room') {
      setDraftRoomCount((value) => getNextGuestCount(type, value, delta));
      return;
    }
    if (type === 'adult') {
      setDraftAdultCount((value) => getNextGuestCount(type, value, delta));
      return;
    }

    setDraftChildCount((value) => getNextGuestCount(type, value, delta));
  }, []);
  const onApplyGuest = useCallback(() => {
    setGuestCounts(draftRoomCount, draftAdultCount, draftChildCount);
    setGuestVisible(false);
  }, [draftAdultCount, draftChildCount, draftRoomCount, setGuestCounts]);

  const onLowPriceDayPress = useCallback(
    (day: DateData) => {
      const nextRange = selectDateRange(day.dateString, tempCheckIn, tempCheckOut);
      setTempCheckIn(nextRange.checkIn);
      setTempCheckOut(nextRange.checkOut);
    },
    [tempCheckIn, tempCheckOut],
  );

  const onConfirmLowPriceCalendar = useCallback(() => {
    if (!isDateRangeValid(tempCheckIn, tempCheckOut)) {
      Alert.alert('日期不合法', '离店日期必须晚于入住日期');
      return;
    }

    setDates(tempCheckIn!, tempCheckOut!);
    setLowPriceVisible(false);
  }, [setDates, tempCheckIn, tempCheckOut]);

  const renderRoom = useCallback(
    ({ item }: ListRenderItemInfo<RoomItem>) => {
      const quantity = roomSelection[item.id] ?? 0;
      return (
        <RoomCard
          name={item.name}
          basePrice={item.basePrice}
          currency={item.currency}
          maxGuests={item.maxGuests}
          breakfast={item.breakfast}
          refundable={item.refundable}
          areaM2={item.areaM2}
          coverImage={normalizeRemoteMediaUrl(item.coverImage)}
          selected={quantity > 0}
          quantity={quantity}
          onDecrease={decreaseHandlers[item.id]}
          onIncrease={increaseHandlers[item.id]}
          disableDecrease={quantity <= 0}
          disableIncrease={
            quantity >= (roomMaxById[item.id] ?? 0) || selectedRoomCount >= filters.roomCount
          }
        />
      );
    },
    [
      decreaseHandlers,
      filters.roomCount,
      increaseHandlers,
      roomMaxById,
      roomSelection,
      selectedRoomCount,
    ],
  );

  if (detailQuery.isPending) {
    return <AppLoading label="正在加载酒店详情..." />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <AppErrorState
        title="详情加载失败"
        description="请稍后重试"
        onRetry={() => {
          void detailQuery.refetch();
        }}
      />
    );
  }

  const facilityLabels = getFacilityLabels(detailQuery.data.facilities);
  const dateHint = formatDateHint(filters.checkIn, filters.checkOut);
  const guestSummary = `${filters.roomCount}间房 ${filters.adultCount}成人 ${filters.childCount}儿童`;
  const filterTags: string[] = [];
  const distanceText = (() => {
    const meters = calculateDistanceMeters(
      filters.lat,
      filters.lng,
      detailQuery.data.lat,
      detailQuery.data.lng,
    );

    if (meters == null) {
      return detailQuery.data.city;
    }
    if (meters < 1000) {
      return `距您直线${Math.max(1, Math.round(meters))}米`;
    }

    const km = meters / 1000;
    return `距您直线${km.toFixed(km >= 10 ? 0 : 1)}公里`;
  })();
  const onPressMap = async () => {
    const { lat, lng, nameCn, address } = detailQuery.data;
    if (lat == null || lng == null) {
      Alert.alert('无法打开地图', '酒店暂未配置坐标信息');
      return;
    }

    const label = encodeURIComponent(nameCn);
    const primaryUrl =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const fallbackUrl = `https://uri.amap.com/marker?position=${lng},${lat}&name=${label}`;

    try {
      const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
      if (canOpenPrimary) {
        await Linking.openURL(primaryUrl);
        return;
      }

      await Linking.openURL(fallbackUrl);
    } catch {
      Alert.alert('无法打开地图', address || '请检查系统地图权限');
    }
  };
  const onPressAsk = async () => {
    const phone = detailQuery.data.contactPhone?.trim();
    if (!phone) {
      Alert.alert('暂无联系电话', '酒店暂未配置电话');
      return;
    }

    const telUrl = `tel:${phone}`;
    try {
      const canCall = await Linking.canOpenURL(telUrl);
      if (!canCall) {
        Alert.alert('无法拨号', `酒店电话：${phone}`);
        return;
      }

      await Linking.openURL(telUrl);
    } catch {
      Alert.alert('无法拨号', `酒店电话：${phone}`);
    }
  };
  const onPressSubmitBooking = () => {
    if (submittingBooking) {
      return;
    }
    if (!isDateRangeValid(filters.checkIn, filters.checkOut)) {
      Alert.alert('日期不完整', '请先确认入住和离店日期');
      return;
    }
    if (rooms.length === 0) {
      Alert.alert('暂无可售房型', '请调整日期后重试');
      return;
    }
    if (roomGap > 0) {
      Alert.alert('房间数量不足', `还需要选择${roomGap}间房`);
      return;
    }
    if (capacityGap > 0) {
      Alert.alert('人数容量不足', `当前房型容量还差${capacityGap}人，请增加房间或更换房型`);
      return;
    }
    if (selectedRoomCount <= 0) {
      Alert.alert('请选择房型', '请先选择房型和数量');
      return;
    }
    const selectedLines = rooms
      .map((room) => {
        const count = roomSelection[room.id] ?? 0;
        if (count <= 0) {
          return null;
        }
        return `${room.name} x${count}`;
      })
      .filter((item): item is string => item != null);
    const estimatedTotal = selectedTotalPrice;
    const previewText = [
      `酒店：${detailQuery.data.nameCn}`,
      `房型组合：${selectedLines.join('；')}`,
      `入住：${filters.checkIn} 至 ${filters.checkOut}`,
      `人数：${guestSummary}`,
      `间数：${selectedRoomCount}间`,
      `预计金额：¥${estimatedTotal}`,
      '说明：演示环境，不会真实扣款。',
    ].join('\n');

    Alert.alert('提交预定（演示）', previewText, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认提交',
        onPress: () => {
          setSubmittingBooking(true);
          if (bookingTimerRef.current) {
            clearTimeout(bookingTimerRef.current);
          }
          bookingTimerRef.current = setTimeout(() => {
            setSubmittingBooking(false);
            bookingTimerRef.current = null;
            const randomTail = Math.floor(1000 + Math.random() * 9000);
            const fakeOrderNo = `EH${Date.now().toString().slice(-8)}${randomTail}`;
            Alert.alert(
              '预定提交成功（演示）',
              `订单号：${fakeOrderNo}\n你可以继续在当前页面查看房型。`,
            );
          }, 850);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.page} edges={['left', 'right', 'bottom']}>
      <FlashList
        data={roomsQuery.isPending || roomsQuery.isError ? [] : rooms}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRoom}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={
          <View>
            <DetailHeroCarousel
              images={images}
              topInset={insets.top}
            />

            <DetailInfoCard
              detail={detailQuery.data}
              facilityLabels={facilityLabels}
              checkIn={filters.checkIn}
              checkOut={filters.checkOut}
              dateHint={dateHint}
              roomCount={filters.roomCount}
              adultCount={filters.adultCount}
              childCount={filters.childCount}
              filterTags={filterTags}
              distanceText={distanceText}
              nightCount={nightCount}
              roomsPending={roomsQuery.isPending}
              roomsError={roomsQuery.isError}
              roomsLength={rooms.length}
              onPressMap={onPressMap}
              onOpenLowPriceCalendar={onOpenLowPriceCalendar}
              onOpenGuestEditor={onOpenGuestEditor}
              onRetryRooms={() => {
                void roomsQuery.refetch();
              }}
            />
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpace} />}
      />

      <DetailBottomBar
        style={bottomBarStyle}
        totalPrice={selectedTotalPrice > 0 ? selectedTotalPrice : null}
        summaryText={bookingSummaryText}
        hintText={bookingHintText}
        mainLabel={submittingBooking ? '提交中...' : '预订'}
        mainDisabled={submittingBooking || roomsQuery.isPending || !canSubmitMixBooking}
        onPressAsk={() => {
          void onPressAsk();
        }}
        onPressMain={onPressSubmitBooking}
      />

      <LowPriceCalendarSheet
        visible={lowPriceVisible}
        currentDate={tempCheckIn ?? todayDate}
        minDate={todayDate}
        markedDates={markedDates}
        canConfirmDate={canConfirmDate}
        tempNightCount={tempNightCount}
        priceMap={lowPriceMap}
        onClose={() => setLowPriceVisible(false)}
        onDayPress={onLowPriceDayPress}
        onConfirm={onConfirmLowPriceCalendar}
      />

      <GuestSheet
        visible={guestVisible}
        sheetStyle={roomGuestSheetStyle}
        roomCount={draftRoomCount}
        adultCount={draftAdultCount}
        childCount={draftChildCount}
        onClose={() => setGuestVisible(false)}
        onUpdateGuest={onUpdateGuest}
        onApply={onApplyGuest}
      />
    </SafeAreaView>
  );
}
