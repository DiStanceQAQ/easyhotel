import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DateData } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppErrorState } from '../components/AppErrorState';
import { AppLoading } from '../components/AppLoading';
import { BannerCarousel } from '../components/BannerCarousel';
import { FilterChip } from '../components/FilterChip';
import { RootStackParamList } from '../navigation/types';
import { fetchBanners, fetchCities, fetchLocationReverse, fetchTags } from '../services/appApi';
import { queryKeys } from '../services/queryKeys';
import { useSearchStore } from '../store/searchStore';
import { spacing } from '../theme/tokens';
import { BannerItem } from '../types/api';
import { getNightCount, isDateRangeValid } from '../utils/date';
import {
  FALLBACK_CITIES,
  FALLBACK_TAGS,
  PRICE_PRESET_OPTIONS,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
} from './search/constants';
import { CalendarSheet } from './search/components/CalendarSheet';
import { CitySheet } from './search/components/CitySheet';
import { GuestSheet } from './search/components/GuestSheet';
import { PriceStarSheet } from './search/components/PriceStarSheet';
import { searchStyles as styles } from './search/styles';
import {
  buildMarkedDates,
  clamp,
  formatDisplay,
  getTodayDateString,
  parsePositiveNumber,
} from './search/utils';
import {
  getErrorMessage,
  getNextGuestCount,
  normalizeCityName,
  selectDateRange,
} from './shared/filter-utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;
const MAX_HERO_BANNERS = 5;
const LOCATION_BANNER_AUTO_HIDE_MS = 4800;
type LocationStatus = 'idle' | 'locating' | 'success' | 'denied' | 'error';

function pickRandomBanners(items: BannerItem[], maxCount: number): BannerItem[] {
  if (items.length <= 1) {
    return items;
  }

  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, maxCount);
}

export function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const city = useSearchStore((state) => state.city);
  const keyword = useSearchStore((state) => state.keyword);
  const checkIn = useSearchStore((state) => state.checkIn);
  const checkOut = useSearchStore((state) => state.checkOut);
  const roomCountInStore = useSearchStore((state) => state.roomCount);
  const adultCountInStore = useSearchStore((state) => state.adultCount);
  const childCountInStore = useSearchStore((state) => state.childCount);
  const star = useSearchStore((state) => state.star);
  const minPrice = useSearchStore((state) => state.minPrice);
  const maxPrice = useSearchStore((state) => state.maxPrice);
  const tags = useSearchStore((state) => state.tags);
  const setCity = useSearchStore((state) => state.setCity);
  const setLocation = useSearchStore((state) => state.setLocation);
  const setKeyword = useSearchStore((state) => state.setKeyword);
  const setDates = useSearchStore((state) => state.setDates);
  const setGuestCounts = useSearchStore((state) => state.setGuestCounts);
  const setStar = useSearchStore((state) => state.setStar);
  const setPriceRange = useSearchStore((state) => state.setPriceRange);
  const setTags = useSearchStore((state) => state.setTags);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [cityVisible, setCityVisible] = useState(false);
  const [guestVisible, setGuestVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationHint, setLocationHint] = useState('');
  const [locationBannerVisible, setLocationBannerVisible] = useState(false);
  const [manualCitySelected, setManualCitySelected] = useState(false);

  const [roomCount, setRoomCount] = useState(roomCountInStore);
  const [adultCount, setAdultCount] = useState(adultCountInStore);
  const [childCount, setChildCount] = useState(childCountInStore);

  const [tempCheckIn, setTempCheckIn] = useState<string | undefined>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<string | undefined>(checkOut);

  const [draftRoomCount, setDraftRoomCount] = useState(1);
  const [draftAdultCount, setDraftAdultCount] = useState(2);
  const [draftChildCount, setDraftChildCount] = useState(0);

  const [draftStar, setDraftStar] = useState<number | undefined>(star);
  const [draftMinPrice, setDraftMinPrice] = useState(
    typeof minPrice === 'number' ? String(minPrice) : '',
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    typeof maxPrice === 'number' ? String(maxPrice) : '',
  );
  const [draftTags, setDraftTags] = useState<string[]>(tags);

  const [sliderMinValue, setSliderMinValueState] = useState(
    typeof minPrice === 'number'
      ? clamp(minPrice, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX)
      : PRICE_SLIDER_MIN,
  );
  const [sliderMaxValue, setSliderMaxValueState] = useState(
    typeof maxPrice === 'number'
      ? clamp(maxPrice, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX)
      : PRICE_SLIDER_MAX,
  );
  const [sliderTrackWidth, setSliderTrackWidthState] = useState(0);

  const minDragStartX = useRef(0);
  const maxDragStartX = useRef(0);
  const sliderTrackWidthRef = useRef(sliderTrackWidth);
  const sliderMinValueRef = useRef(sliderMinValue);
  const sliderMaxValueRef = useRef(sliderMaxValue);
  const locationBusyRef = useRef(false);
  const locationBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSliderTrackWidth = useCallback((value: number) => {
    sliderTrackWidthRef.current = value;
    setSliderTrackWidthState(value);
  }, []);

  const setSliderMinValue = useCallback((value: number) => {
    sliderMinValueRef.current = value;
    setSliderMinValueState(value);
  }, []);

  const setSliderMaxValue = useCallback((value: number) => {
    sliderMaxValueRef.current = value;
    setSliderMaxValueState(value);
  }, []);

  useEffect(() => {
    sliderTrackWidthRef.current = sliderTrackWidth;
  }, [sliderTrackWidth]);

  useEffect(() => {
    sliderMinValueRef.current = sliderMinValue;
  }, [sliderMinValue]);

  useEffect(() => {
    sliderMaxValueRef.current = sliderMaxValue;
  }, [sliderMaxValue]);

  const bannerQuery = useQuery({
    queryKey: queryKeys.banners(),
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
  });

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags(),
    queryFn: fetchTags,
    staleTime: 30 * 60 * 1000,
  });

  const citiesQuery = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: fetchCities,
    staleTime: 30 * 60 * 1000,
  });

  const tagOptions = useMemo(
    () => tagsQuery.data?.list ?? (tagsQuery.isError ? FALLBACK_TAGS : []),
    [tagsQuery.data?.list, tagsQuery.isError],
  );
  const cityOptions = useMemo(
    () => citiesQuery.data?.list ?? (citiesQuery.isError ? FALLBACK_CITIES : []),
    [citiesQuery.data?.list, citiesQuery.isError],
  );
  const heroBanners = useMemo(
    () => pickRandomBanners(bannerQuery.data ?? [], MAX_HERO_BANNERS),
    [bannerQuery.data],
  );
  const quickTagItems = useMemo(() => tagOptions.slice(0, 8), [tagOptions]);

  const showLocationBanner = useCallback((message: string, persist = false) => {
    setLocationHint(message);
    setLocationBannerVisible(true);

    if (locationBannerTimerRef.current) {
      clearTimeout(locationBannerTimerRef.current);
      locationBannerTimerRef.current = null;
    }

    if (!persist) {
      locationBannerTimerRef.current = setTimeout(() => {
        setLocationBannerVisible(false);
      }, LOCATION_BANNER_AUTO_HIDE_MS);
    }
  }, []);

  const mapToKnownCity = useCallback(
    (rawCity?: string | null): string | undefined => {
      const normalized = normalizeCityName(rawCity);
      if (!normalized) {
        return undefined;
      }

      const matched = cityOptions.find((item) => normalizeCityName(item.city) === normalized);
      return matched?.city ?? normalized;
    },
    [cityOptions],
  );

  const locateCurrentCity = useCallback(
    async (trigger: 'auto' | 'manual') => {
      if (locationBusyRef.current) {
        return;
      }
      locationBusyRef.current = true;

      setLocationStatus('locating');
      showLocationBanner('正在定位...', true);

      try {
        const serviceEnabled = await Location.hasServicesEnabledAsync();
        if (!serviceEnabled) {
          setLocationStatus('denied');
          showLocationBanner('系统定位未开启，请开启后重试', true);
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setLocationStatus('denied');
          showLocationBanner('未开启定位权限，请手动选择城市', true);
          return;
        }

        const providerStatus = await Location.getProviderStatusAsync();
        if (
          Platform.OS === 'android' &&
          providerStatus.gpsAvailable === false &&
          providerStatus.networkAvailable === false
        ) {
          setLocationStatus('error');
          showLocationBanner('当前设备定位提供者不可用，请检查定位设置', true);
          return;
        }

        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            // Ignore user cancellation, keep best-effort positioning flow.
          }
        }

        let position: Location.LocationObject | null = null;
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          });
        } catch (positionError) {
          try {
            position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
              mayShowUserSettingsDialog: true,
            });
          } catch {
            const fallback = await Location.getLastKnownPositionAsync({
              maxAge: 24 * 60 * 60 * 1000,
            });

            if (!fallback) {
              throw positionError;
            }

            position = fallback;
            if (__DEV__) {
              console.log(
                `[SearchScreen] getCurrentPositionAsync failed, fallback to last known position: ${getErrorMessage(positionError)}`,
              );
            }
          }
        }

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        let localCity: string | null = null;
        let localNearby: string | null = null;
        try {
          const reverseList = await Location.reverseGeocodeAsync(coords);
          const nearest = reverseList[0];
          if (nearest) {
            localCity = nearest.city ?? nearest.subregion ?? nearest.region ?? null;
            localNearby = nearest.district ?? nearest.street ?? null;
          }
        } catch {
          // Ignore local reverse-geocode failures and fallback to remote response.
        }

        let remoteNearby: string | null = null;
        let matchedCity = mapToKnownCity(localCity);
        try {
          const remote = await fetchLocationReverse(coords.latitude, coords.longitude);
          const remoteCity = mapToKnownCity(remote.city);
          if (remoteCity) {
            matchedCity = remoteCity;
          }
          remoteNearby = remote.nearby ?? remote.district ?? remote.formattedAddress;
        } catch {
          // Ignore remote failures and keep local reverse-geocode results.
        }

        setLocation(coords.latitude, coords.longitude);

        if ((trigger === 'manual' || !manualCitySelected) && matchedCity) {
          setCity(matchedCity);
        }

        const resolvedCity = matchedCity ?? city ?? '当前位置';
        const nearby = remoteNearby ?? localNearby;
        const message = nearby
          ? `已定位到 ${resolvedCity}，${nearby}附近`
          : `已定位到 ${resolvedCity}`;

        setLocationStatus('success');
        showLocationBanner(message);
      } catch (error) {
        const reason = getErrorMessage(error);
        console.warn(`[SearchScreen] locateCurrentCity failed: ${reason}`);
        setLocationStatus('error');
        if (reason.includes('Current location is unavailable')) {
          showLocationBanner('当前无法获取坐标，请开启高精度定位或先在地图App定位一次', true);
        } else {
          showLocationBanner('定位失败，请手动选择城市', true);
        }
      } finally {
        locationBusyRef.current = false;
      }
    },
    [city, manualCitySelected, mapToKnownCity, setCity, setLocation, showLocationBanner],
  );

  useEffect(
    () => () => {
      if (locationBannerTimerRef.current) {
        clearTimeout(locationBannerTimerRef.current);
      }
    },
    [],
  );

  const nights = getNightCount(checkIn, checkOut);
  const tempNightCount = getNightCount(tempCheckIn, tempCheckOut);
  const canConfirmDate = isDateRangeValid(tempCheckIn, tempCheckOut);
  const todayDate = useMemo(() => getTodayDateString(), []);
  const guestSummary = `${roomCount}间房 ${adultCount}成人 ${childCount}儿童`;

  const markedDates = useMemo(
    () => (calendarVisible ? buildMarkedDates(tempCheckIn, tempCheckOut) : {}),
    [calendarVisible, tempCheckIn, tempCheckOut],
  );

  const bottomSheetCardStyle = useMemo(
    () => [
      styles.bottomCard,
      {
        paddingBottom: spacing.lg + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );

  const roomGuestSheetStyle = useMemo(
    () => [
      styles.roomGuestSheet,
      {
        paddingBottom: spacing.md + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );

  const filterSheetStyle = useMemo(
    () => [
      styles.filterSheet,
      {
        paddingBottom: spacing.md + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );

  const calendarSheetStyle = useMemo(
    () => [
      styles.calendarSheet,
      {
        paddingBottom: spacing.sm + Math.max(insets.bottom, spacing.sm),
      },
    ],
    [insets.bottom],
  );

  const selectedPresetLabel = useMemo(() => {
    const draftMin = parsePositiveNumber(draftMinPrice);
    const draftMax = parsePositiveNumber(draftMaxPrice);
    const matched = PRICE_PRESET_OPTIONS.find(
      (item) => item.min === draftMin && item.max === draftMax,
    );
    return matched?.label;
  }, [draftMaxPrice, draftMinPrice]);

  const valueToOffsetWithWidth = useCallback((value: number, trackWidth: number) => {
    if (trackWidth <= 0) {
      return 0;
    }

    const ratio =
      (clamp(value, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX) - PRICE_SLIDER_MIN) /
      (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN);

    return ratio * trackWidth;
  }, []);

  const valueToOffset = useCallback(
    (value: number) => valueToOffsetWithWidth(value, sliderTrackWidth),
    [sliderTrackWidth, valueToOffsetWithWidth],
  );

  const valueToOffsetFromRef = useCallback(
    (value: number) => valueToOffsetWithWidth(value, sliderTrackWidthRef.current),
    [valueToOffsetWithWidth],
  );

  const offsetToValue = useCallback((offset: number) => {
    const trackWidth = sliderTrackWidthRef.current;
    if (trackWidth <= 0) {
      return PRICE_SLIDER_MIN;
    }

    const ratio = clamp(offset, 0, trackWidth) / trackWidth;
    return Math.round(PRICE_SLIDER_MIN + ratio * (PRICE_SLIDER_MAX - PRICE_SLIDER_MIN));
  }, []);

  const minThumbOffset = useMemo(
    () => valueToOffset(sliderMinValue),
    [sliderMinValue, valueToOffset],
  );
  const maxThumbOffset = useMemo(
    () => valueToOffset(sliderMaxValue),
    [sliderMaxValue, valueToOffset],
  );

  const minThumbPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          minDragStartX.current = valueToOffsetFromRef(sliderMinValueRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          const trackWidth = sliderTrackWidthRef.current;
          if (trackWidth <= 0) {
            return;
          }
          const maxOffset = valueToOffsetFromRef(sliderMaxValueRef.current);
          const nextOffset = clamp(minDragStartX.current + gestureState.dx, 0, maxOffset);
          const nextValue = offsetToValue(nextOffset);
          setSliderMinValue(nextValue);
          setDraftMinPrice(String(nextValue));
        },
      }),
    [offsetToValue, setSliderMinValue, valueToOffsetFromRef],
  );

  const maxThumbPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          maxDragStartX.current = valueToOffsetFromRef(sliderMaxValueRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          const trackWidth = sliderTrackWidthRef.current;
          if (trackWidth <= 0) {
            return;
          }
          const minOffset = valueToOffsetFromRef(sliderMinValueRef.current);
          const nextOffset = clamp(maxDragStartX.current + gestureState.dx, minOffset, trackWidth);
          const nextValue = offsetToValue(nextOffset);
          setSliderMaxValue(nextValue);
          setDraftMaxPrice(nextValue >= PRICE_SLIDER_MAX ? '' : String(nextValue));
        },
      }),
    [offsetToValue, setSliderMaxValue, valueToOffsetFromRef],
  );

  const onCalendarSelect = useCallback(
    (day: DateData) => {
      const nextRange = selectDateRange(day.dateString, tempCheckIn, tempCheckOut);
      setTempCheckIn(nextRange.checkIn);
      setTempCheckOut(nextRange.checkOut);
    },
    [tempCheckIn, tempCheckOut],
  );

  const onOpenCalendar = useCallback(() => {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
    setCalendarVisible(true);
  }, [checkIn, checkOut]);

  const onConfirmDates = useCallback(() => {
    if (!isDateRangeValid(tempCheckIn, tempCheckOut)) {
      Alert.alert('日期不合法', '离店日期必须晚于入住日期');
      return;
    }

    setDates(tempCheckIn!, tempCheckOut!);
    setCalendarVisible(false);
  }, [setDates, tempCheckIn, tempCheckOut]);

  const onOpenFilter = () => {
    setDraftStar(star);
    setDraftMinPrice(typeof minPrice === 'number' ? String(minPrice) : '');
    setDraftMaxPrice(typeof maxPrice === 'number' ? String(maxPrice) : '');
    setDraftTags(tags);

    const nextMin =
      typeof minPrice === 'number'
        ? clamp(minPrice, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX)
        : PRICE_SLIDER_MIN;
    const nextMax =
      typeof maxPrice === 'number'
        ? clamp(maxPrice, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX)
        : PRICE_SLIDER_MAX;

    setSliderMinValue(Math.min(nextMin, nextMax));
    setSliderMaxValue(Math.max(nextMin, nextMax));
    setFilterVisible(true);
  };

  const onApplyFilter = () => {
    const nextMin = parsePositiveNumber(draftMinPrice);
    const nextMax = parsePositiveNumber(draftMaxPrice);

    if (typeof nextMin === 'number' && typeof nextMax === 'number' && nextMax < nextMin) {
      Alert.alert('价格区间错误', '最高价不能低于最低价');
      return;
    }

    setStar(draftStar);
    setPriceRange(nextMin, nextMax);
    setTags(draftTags);
    setFilterVisible(false);
  };

  const onClearFilter = () => {
    setDraftStar(undefined);
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftTags([]);
    setSliderMinValue(PRICE_SLIDER_MIN);
    setSliderMaxValue(PRICE_SLIDER_MAX);
  };

  const onSelectPricePreset = (min?: number, max?: number) => {
    const nextMin = typeof min === 'number' ? clamp(min, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX) : 0;
    const nextMax =
      typeof max === 'number' ? clamp(max, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX) : PRICE_SLIDER_MAX;

    setDraftMinPrice(typeof min === 'number' ? String(nextMin) : '');
    setDraftMaxPrice(typeof max === 'number' ? String(max) : '');
    setSliderMinValue(Math.min(nextMin, nextMax));
    setSliderMaxValue(Math.max(nextMin, nextMax));
  };

  const onChangeMinPriceInput = (value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    if (sanitized.length === 0) {
      setDraftMinPrice('');
      setSliderMinValue(PRICE_SLIDER_MIN);
      return;
    }

    const parsed = clamp(Number(sanitized), PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);
    const nextValue = Math.min(parsed, sliderMaxValue);
    setDraftMinPrice(String(nextValue));
    setSliderMinValue(nextValue);
  };

  const onChangeMaxPriceInput = (value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    if (sanitized.length === 0) {
      setDraftMaxPrice('');
      setSliderMaxValue(PRICE_SLIDER_MAX);
      return;
    }

    const parsed = clamp(Number(sanitized), PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);
    const nextValue = Math.max(parsed, sliderMinValue);
    setDraftMaxPrice(nextValue >= PRICE_SLIDER_MAX ? '' : String(nextValue));
    setSliderMaxValue(nextValue);
  };

  const onOpenGuest = () => {
    setDraftRoomCount(roomCount);
    setDraftAdultCount(adultCount);
    setDraftChildCount(childCount);
    setGuestVisible(true);
  };

  const onUpdateGuest = (type: 'room' | 'adult' | 'child', delta: 1 | -1) => {
    if (type === 'room') {
      setDraftRoomCount((value) => getNextGuestCount(type, value, delta));
      return;
    }

    if (type === 'adult') {
      setDraftAdultCount((value) => getNextGuestCount(type, value, delta));
      return;
    }

    setDraftChildCount((value) => getNextGuestCount(type, value, delta));
  };

  const onApplyGuest = () => {
    setRoomCount(draftRoomCount);
    setAdultCount(draftAdultCount);
    setChildCount(draftChildCount);
    setGuestCounts(draftRoomCount, draftAdultCount, draftChildCount);
    setGuestVisible(false);
  };

  const onSearch = () => {
    if (!isDateRangeValid(checkIn, checkOut)) {
      Alert.alert('日期不合法', '离店日期必须晚于入住日期');
      return;
    }

    setGuestCounts(roomCount, adultCount, childCount);

    navigation.navigate('HotelList', {
      roomCount,
      adultCount,
      childCount,
    });
  };

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (star) {
      parts.push(`${star}星`);
    }
    if (typeof minPrice === 'number' && typeof maxPrice === 'number') {
      parts.push(`¥${minPrice}-${maxPrice}`);
    } else if (typeof maxPrice === 'number') {
      parts.push(`¥${maxPrice}以下`);
    } else if (typeof minPrice === 'number') {
      parts.push(`¥${minPrice}以上`);
    }
    if (parts.length === 0) {
      return '价格/星级';
    }
    return parts.join(' · ');
  }, [maxPrice, minPrice, star]);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {bannerQuery.isPending ? (
            <View style={styles.heroFallback}>
              <AppLoading label="活动加载中..." />
            </View>
          ) : null}

          {bannerQuery.isError ? (
            <View style={styles.heroFallback}>
              <AppErrorState
                title="活动图加载失败"
                description="可直接使用查询功能"
                onRetry={() => {
                  void bannerQuery.refetch();
                }}
              />
            </View>
          ) : null}

          {!bannerQuery.isPending && !bannerQuery.isError ? (
            heroBanners.length > 0 ? (
              <BannerCarousel
                data={heroBanners}
                onPressBanner={(hotelId) => {
                  navigation.navigate('HotelDetail', { hotelId });
                }}
              />
            ) : (
              <View style={styles.heroFallback}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80',
                  }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              </View>
            )
          ) : null}
        </View>

        <View style={styles.searchCard}>
          {locationBannerVisible ? (
            <View style={styles.locationBanner}>
              <Text style={styles.locationBannerIcon}>⌖</Text>
              <Text style={styles.locationBannerText} numberOfLines={1}>
                {locationHint}
              </Text>
              <Pressable
                onPress={() => setLocationBannerVisible(false)}
                style={styles.locationBannerCloseBtn}
              >
                <Text style={styles.locationBannerCloseText}>✕</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <View style={styles.cityBlock}>
              <Text style={styles.inputLabel}>城市</Text>
              <View style={styles.cityValueRow}>
                <Pressable onPress={() => setCityVisible(true)} style={styles.cityTap}>
                  <Text style={styles.cityValue}>{city ?? '上海'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void locateCurrentCity('manual');
                  }}
                  style={styles.locateAction}
                >
                  {locationStatus === 'locating' ? (
                    <ActivityIndicator size="small" color="#1570ff" />
                  ) : (
                    <Text style={styles.locateActionIcon}>⌖</Text>
                  )}
                </Pressable>
              </View>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.keywordBlock}>
              <Text style={styles.inputLabel}>位置/品牌/酒店</Text>
              <TextInput
                value={keyword ?? ''}
                onChangeText={setKeyword}
                placeholder="请输入关键词"
                placeholderTextColor="#aeb7c5"
                style={styles.keywordInput}
              />
            </View>
          </View>

          <Pressable onPress={onOpenCalendar} style={styles.dateRow}>
            <View style={styles.dateCell}>
              <Text style={styles.dateValue}>{formatDisplay(checkIn)}</Text>
              <Text style={styles.dateHint}>入住</Text>
            </View>
            <Text style={styles.dateSeparator}>—</Text>
            <View style={styles.dateCell}>
              <Text style={styles.dateValue}>{formatDisplay(checkOut)}</Text>
              <Text style={styles.dateHint}>离店</Text>
            </View>
            <Text style={styles.nightText}>{`共${nights || '--'}晚`}</Text>
          </Pressable>

          <View style={styles.settingRow}>
            <Pressable onPress={onOpenGuest} style={[styles.settingCell, styles.settingCellLeft]}>
              <Text style={styles.settingValue}>{guestSummary}</Text>
              <Text style={styles.settingArrow}>▾</Text>
            </Pressable>

            <View style={styles.settingDivider} />

            <Pressable onPress={onOpenFilter} style={[styles.settingCell, styles.settingCellRight]}>
              <Text style={styles.settingLabel}>价格/星级</Text>
              {filterSummary !== '价格/星级' ? (
                <Text style={styles.settingSummary} numberOfLines={1}>
                  {filterSummary}
                </Text>
              ) : null}
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
          >
            {quickTagItems.map((item) => (
              <FilterChip
                key={item.id}
                label={item.name}
                selected={tags.includes(item.name)}
                onPress={() => {
                  if (tags.includes(item.name)) {
                    setTags(tags.filter((tag) => tag !== item.name));
                    return;
                  }

                  if (tags.length >= 5) {
                    return;
                  }

                  setTags([...tags, item.name]);
                }}
                variant="rect"
              />
            ))}
          </ScrollView>

          <Pressable onPress={onSearch} style={styles.searchButtonWrap}>
            <LinearGradient colors={['#0d6dff', '#157dff']} style={styles.searchButton}>
              <Text style={styles.searchText}>查询</Text>
              <View style={styles.searchGlow} />
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      {calendarVisible ? (
        <CalendarSheet
          visible={calendarVisible}
          sheetStyle={calendarSheetStyle}
          currentDate={tempCheckIn ?? todayDate}
          minDate={todayDate}
          markedDates={markedDates}
          canConfirmDate={canConfirmDate}
          tempNightCount={tempNightCount}
          onClose={() => setCalendarVisible(false)}
          onDayPress={onCalendarSelect}
          onConfirm={onConfirmDates}
        />
      ) : null}

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

      <CitySheet
        visible={cityVisible}
        sheetStyle={bottomSheetCardStyle}
        city={city ?? ''}
        cityOptions={cityOptions}
        onSelectCity={(nextCity) => {
          setManualCitySelected(true);
          setLocationStatus('idle');
          setLocationBannerVisible(false);
          setCity(nextCity);
          setLocation(undefined, undefined);
          setCityVisible(false);
        }}
        onClose={() => setCityVisible(false)}
      />

      <PriceStarSheet
        visible={filterVisible}
        sheetStyle={filterSheetStyle}
        draftStar={draftStar}
        draftMinPrice={draftMinPrice}
        draftMaxPrice={draftMaxPrice}
        selectedPresetLabel={selectedPresetLabel}
        minThumbOffset={minThumbOffset}
        maxThumbOffset={maxThumbOffset}
        minThumbPanHandlers={minThumbPanResponder.panHandlers}
        maxThumbPanHandlers={maxThumbPanResponder.panHandlers}
        onClose={() => setFilterVisible(false)}
        onTrackLayout={(event) => {
          const trackWidth = event.nativeEvent.layout.width;
          if (trackWidth <= 0) {
            return;
          }
          setSliderTrackWidth(trackWidth);
        }}
        onChangeMinPriceInput={onChangeMinPriceInput}
        onChangeMaxPriceInput={onChangeMaxPriceInput}
        onSelectPricePreset={onSelectPricePreset}
        onToggleStar={(value) => {
          const selected = value === 2 ? draftStar === 1 || draftStar === 2 : draftStar === value;
          setDraftStar(selected ? undefined : value);
        }}
        onClear={onClearFilter}
        onApply={onApplyFilter}
      />
    </SafeAreaView>
  );
}
