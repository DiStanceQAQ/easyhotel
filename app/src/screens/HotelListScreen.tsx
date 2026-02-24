import { useFocusEffect } from '@react-navigation/native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList, FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { DateData } from 'react-native-calendars';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppEmptyState } from '../components/AppEmptyState';
import { AppErrorState } from '../components/AppErrorState';
import { AppLoading } from '../components/AppLoading';
import { HotelCard } from '../components/HotelCard';
import { useSearchFilters } from '../hooks/useSearchFilters';
import { RootStackParamList } from '../navigation/types';
import { fetchHotels, fetchLocationReverse, fetchTags } from '../services/appApi';
import { queryKeys } from '../services/queryKeys';
import { useSearchStore } from '../store/searchStore';
import { spacing } from '../theme/tokens';
import { HotelListItem, SortType } from '../types/api';
import { getNightCount, isDateRangeValid } from '../utils/date';
import { shouldLoadNextPage } from '../utils/pagination';
import { buildHotelListQuery, serializeQuery } from '../utils/query';
import { FALLBACK_TAGS, PAGE_SIZE, SORT_LABEL_MAP, SORT_OPTIONS } from './hotel-list/constants';
import { ListFilterSheet } from './hotel-list/components/ListFilterSheet';
import { ListHeaderBar } from './hotel-list/components/ListHeaderBar';
import { CalendarSheet } from './search/components/CalendarSheet';
import { GuestSheet } from './search/components/GuestSheet';
import { searchStyles as searchSheetStyles } from './search/styles';
import { buildMarkedDates, formatDisplay, getTodayDateString } from './search/utils';
import { hotelListStyles as styles } from './hotel-list/styles';
import { parsePositivePrice } from './hotel-list/utils';
import {
  getNextGuestCount,
  normalizeCityName,
  selectDateRange,
} from './shared/filter-utils';

type Props = NativeStackScreenProps<RootStackParamList, 'HotelList'>;
const HOTEL_LIST_DRAW_DISTANCE = 1200;
type ActivePanel = 'none' | 'search' | 'sort' | 'filter';

export function HotelListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const filters = useSearchFilters();
  const [roomCount, setRoomCount] = useState(route.params?.roomCount ?? filters.roomCount);
  const [adultCount, setAdultCount] = useState(route.params?.adultCount ?? filters.adultCount);
  const [childCount, setChildCount] = useState(route.params?.childCount ?? filters.childCount);

  const setSort = useSearchStore((state) => state.setSort);
  const setKeyword = useSearchStore((state) => state.setKeyword);
  const setCity = useSearchStore((state) => state.setCity);
  const setLocation = useSearchStore((state) => state.setLocation);
  const setDates = useSearchStore((state) => state.setDates);
  const setGuestCounts = useSearchStore((state) => state.setGuestCounts);
  const setStar = useSearchStore((state) => state.setStar);
  const setPriceRange = useSearchStore((state) => state.setPriceRange);
  const setTags = useSearchStore((state) => state.setTags);
  const setFacilities = useSearchStore((state) => state.setFacilities);

  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [guestVisible, setGuestVisible] = useState(false);
  const [topSearchBarHeight, setTopSearchBarHeight] = useState(0);
  const [sortBarHeight, setSortBarHeight] = useState(0);
  const [keywordFocused, setKeywordFocused] = useState(false);
  const [keywordInput, setKeywordInput] = useState(filters.keyword ?? '');
  const [panelLocationText, setPanelLocationText] = useState('');
  const [panelLocating, setPanelLocating] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<string | undefined>(filters.checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<string | undefined>(filters.checkOut);
  const [draftRoomCount, setDraftRoomCount] = useState(roomCount);
  const [draftAdultCount, setDraftAdultCount] = useState(adultCount);
  const [draftChildCount, setDraftChildCount] = useState(childCount);
  const [draftStar, setDraftStar] = useState<number | undefined>(filters.star);
  const [draftMinPrice, setDraftMinPrice] = useState(
    typeof filters.minPrice === 'number' ? String(filters.minPrice) : '',
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    typeof filters.maxPrice === 'number' ? String(filters.maxPrice) : '',
  );
  const [draftTags, setDraftTags] = useState<string[]>(filters.tags);
  const [draftFacilities, setDraftFacilities] = useState<string[]>(filters.facilities);

  const listRef = useRef<FlashListRef<HotelListItem> | null>(null);
  const offsetRef = useRef(0);

  const filterFingerprint = useMemo(
    () => serializeQuery(buildHotelListQuery(filters, 1, PAGE_SIZE)),
    [filters],
  );

  const tagQuery = useQuery({
    queryKey: queryKeys.tags(),
    queryFn: fetchTags,
    staleTime: 30 * 60 * 1000,
  });

  const hotelsQuery = useInfiniteQuery({
    queryKey: queryKeys.hotels(filterFingerprint),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchHotels(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) {
        return undefined;
      }
      return lastPage.page + 1;
    },
  });

  const hotels = useMemo(
    () => hotelsQuery.data?.pages.flatMap((page) => page.list) ?? [],
    [hotelsQuery.data],
  );
  const tagOptions = tagQuery.data?.list ?? (tagQuery.isError ? FALLBACK_TAGS : []);
  const currentSortLabel = SORT_LABEL_MAP[filters.sort] ?? '智能排序';
  const nightCount = getNightCount(filters.checkIn, filters.checkOut);
  const tempNightCount = getNightCount(tempCheckIn, tempCheckOut);
  const canConfirmDate = isDateRangeValid(tempCheckIn, tempCheckOut);
  const todayDate = useMemo(() => getTodayDateString(), []);
  const markedDates = useMemo(
    () => (calendarVisible ? buildMarkedDates(tempCheckIn, tempCheckOut) : {}),
    [calendarVisible, tempCheckIn, tempCheckOut],
  );
  const dropdownTop = insets.top + (topSearchBarHeight || 56) + (sortBarHeight || 40);
  const searchPanelTop = insets.top + (topSearchBarHeight || 56);
  const calendarSheetStyle = useMemo(
    () => [
      searchSheetStyles.calendarSheet,
      {
        paddingBottom: spacing.sm + Math.max(insets.bottom, spacing.sm),
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

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        if (listRef.current && offsetRef.current > 0) {
          listRef.current.scrollToOffset({
            offset: offsetRef.current,
            animated: false,
          });
        }
      });
    }, []),
  );

  useEffect(() => {
    if (offsetRef.current <= 0) {
      return;
    }

    listRef.current?.scrollToOffset({
      offset: 0,
      animated: false,
    });
    offsetRef.current = 0;
  }, [filterFingerprint]);

  useEffect(() => {
    setKeywordInput(filters.keyword ?? '');
  }, [filters.keyword]);

  useEffect(() => {
    if (filters.sort === 'rating_desc') {
      setSort('default');
    }
  }, [filters.sort, setSort]);

  useEffect(() => {
    const cityLabel = filters.city ?? '上海';
    const keywordLabel = keywordInput.trim();
    setPanelLocationText(keywordLabel ? `${cityLabel}，${keywordLabel}` : cityLabel);
  }, [filters.city, keywordInput]);

  const onPressHotel = useCallback(
    (hotelId: string) => {
      navigation.navigate('HotelDetail', { hotelId });
    },
    [navigation],
  );

  const renderHotel = useCallback(
    ({ item }: ListRenderItemInfo<HotelListItem>) => (
      <HotelCard
        id={item.id}
        nameCn={item.nameCn}
        nameEn={item.nameEn}
        star={item.star}
        city={item.city}
        address={item.address}
        distanceMeters={item.distanceMeters}
        coverImage={item.coverImage}
        minPrice={item.minPrice}
        description={item.description}
        tags={item.tags}
        onPressHotel={onPressHotel}
      />
    ),
    [onPressHotel],
  );

  const onListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onEndReached = useCallback(() => {
    const canLoad = shouldLoadNextPage({
      hasNextPage: hotelsQuery.hasNextPage,
      isFetchingNextPage: hotelsQuery.isFetchingNextPage,
      isPending: hotelsQuery.isPending,
      isError: hotelsQuery.isError,
    });

    if (canLoad) {
      void hotelsQuery.fetchNextPage();
    }
  }, [hotelsQuery]);

  const closePanel = useCallback(() => {
    setActivePanel('none');
  }, []);

  const syncDraftFromFilters = useCallback(() => {
    setDraftStar(filters.star);
    setDraftMinPrice(typeof filters.minPrice === 'number' ? String(filters.minPrice) : '');
    setDraftMaxPrice(typeof filters.maxPrice === 'number' ? String(filters.maxPrice) : '');
    setDraftTags(filters.tags);
    setDraftFacilities(filters.facilities);
  }, [filters.facilities, filters.maxPrice, filters.minPrice, filters.star, filters.tags]);

  const toggleSearchPanel = useCallback(() => {
    Keyboard.dismiss();
    setKeywordFocused(false);
    setActivePanel((current) => (current === 'search' ? 'none' : 'search'));
  }, []);

  const onOpenDateEditor = useCallback(() => {
    setTempCheckIn(filters.checkIn);
    setTempCheckOut(filters.checkOut);
    setCalendarVisible(true);
  }, [filters.checkIn, filters.checkOut]);

  const onCalendarSelect = useCallback(
    (day: DateData) => {
      const nextRange = selectDateRange(day.dateString, tempCheckIn, tempCheckOut);
      setTempCheckIn(nextRange.checkIn);
      setTempCheckOut(nextRange.checkOut);
    },
    [tempCheckIn, tempCheckOut],
  );

  const onConfirmDates = useCallback(() => {
    if (!isDateRangeValid(tempCheckIn, tempCheckOut)) {
      Alert.alert('日期不合法', '离店日期必须晚于入住日期');
      return;
    }

    setDates(tempCheckIn!, tempCheckOut!);
    setCalendarVisible(false);
  }, [setDates, tempCheckIn, tempCheckOut]);

  const onOpenGuestEditor = useCallback(() => {
    setDraftRoomCount(roomCount);
    setDraftAdultCount(adultCount);
    setDraftChildCount(childCount);
    setGuestVisible(true);
  }, [adultCount, childCount, roomCount]);

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
    setRoomCount(draftRoomCount);
    setAdultCount(draftAdultCount);
    setChildCount(draftChildCount);
    setGuestCounts(draftRoomCount, draftAdultCount, draftChildCount);
    setGuestVisible(false);
  }, [draftAdultCount, draftChildCount, draftRoomCount, setGuestCounts]);

  const toggleSortPanel = useCallback(() => {
    Keyboard.dismiss();
    setKeywordFocused(false);
    setActivePanel((current) => (current === 'sort' ? 'none' : 'sort'));
  }, []);

  const toggleFilterPanel = useCallback(() => {
    Keyboard.dismiss();
    setKeywordFocused(false);
    syncDraftFromFilters();
    setActivePanel((current) => (current === 'filter' ? 'none' : 'filter'));
  }, [syncDraftFromFilters]);

  const toggleDraftTag = (name: string) => {
    setDraftTags((current) => {
      if (current.includes(name)) {
        return current.filter((item) => item !== name);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, name];
    });
  };

  const toggleQuickTag = useCallback(
    (name: string) => {
      if (filters.tags.includes(name)) {
        setTags(filters.tags.filter((item) => item !== name));
        return;
      }

      if (filters.tags.length >= 5) {
        return;
      }

      setTags([...filters.tags, name]);
    },
    [filters.tags, setTags],
  );

  const locateCurrentCoordinates = useCallback(async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      Alert.alert('定位未开启', '请先开启系统定位服务');
      return null;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('需要定位权限', '请允许应用访问定位后重试');
      return null;
    }

    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // Keep best-effort flow when user does not adjust provider settings.
      }
    }

    let position: Location.LocationObject | null = null;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });
    } catch {
      position = await Location.getLastKnownPositionAsync({
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    if (!position) {
      Alert.alert('定位失败', '当前无法获取有效位置，请稍后重试');
      return null;
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }, []);

  const onSelectSort = useCallback(
    async (sortType: SortType) => {
      if (sortType === 'distance_asc') {
        const hasLocation = typeof filters.lat === 'number' && typeof filters.lng === 'number';
        if (!hasLocation) {
          if (panelLocating) {
            return;
          }

          setPanelLocating(true);
          try {
            const coords = await locateCurrentCoordinates();
            if (!coords) {
              return;
            }
            setLocation(coords.latitude, coords.longitude);
          } finally {
            setPanelLocating(false);
          }
        }
      }

      if (filters.sort !== sortType) {
        setSort(sortType);
      }
      setActivePanel('none');
    },
    [filters.lat, filters.lng, filters.sort, locateCurrentCoordinates, panelLocating, setLocation, setSort],
  );

  const applyFilter = () => {
    const nextMin = parsePositivePrice(draftMinPrice);
    const nextMax = parsePositivePrice(draftMaxPrice);
    if (typeof nextMin === 'number' && typeof nextMax === 'number' && nextMin > nextMax) {
      Alert.alert('价格区间有误', '最低价不能高于最高价');
      return;
    }

    setStar(draftStar);
    setPriceRange(nextMin, nextMax);
    setTags(draftTags);
    setFacilities(draftFacilities);
    setActivePanel('none');
  };

  const onSetDraftMinPrice = useCallback((value: string) => {
    setDraftMinPrice(value.replace(/[^\d]/g, ''));
  }, []);

  const onSetDraftMaxPrice = useCallback((value: string) => {
    setDraftMaxPrice(value.replace(/[^\d]/g, ''));
  }, []);

  const onToggleDraftFacility = useCallback((key: string) => {
    setDraftFacilities((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, key];
    });
  }, []);

  const applyKeyword = useCallback(
    (value: string) => {
      const nextKeyword = value.trim();
      if ((filters.keyword ?? '') !== nextKeyword) {
        setKeyword(nextKeyword);
      }
    },
    [filters.keyword, setKeyword],
  );

  const onChangeKeyword = useCallback((value: string) => {
    setKeywordInput(value);
  }, []);

  const onFocusKeyword = useCallback(() => {
    setKeywordFocused(true);
    setActivePanel('none');
  }, []);

  const onBlurKeyword = useCallback(() => {
    applyKeyword(keywordInput);
    setKeywordFocused(false);
  }, [applyKeyword, keywordInput]);

  const onSubmitKeyword = useCallback(() => {
    applyKeyword(keywordInput);
    Keyboard.dismiss();
    setKeywordFocused(false);
  }, [applyKeyword, keywordInput]);

  const onClearKeyword = useCallback(() => {
    setKeywordInput('');
    if (filters.keyword) {
      setKeyword('');
    }
    Keyboard.dismiss();
    setKeywordFocused(false);
  }, [filters.keyword, setKeyword]);

  const onLocateFromSearchPanel = useCallback(async () => {
    if (panelLocating) {
      return;
    }

    setPanelLocating(true);
    try {
      const coords = await locateCurrentCoordinates();
      if (!coords) {
        return;
      }

      let localCity: string | null = null;
      try {
        const reverseList = await Location.reverseGeocodeAsync(coords);
        const nearest = reverseList[0];
        if (nearest) {
          localCity = nearest.city ?? nearest.subregion ?? nearest.region ?? null;
        }
      } catch {
        // Keep remote reverse-geocode as fallback.
      }

      let resolvedCity = normalizeCityName(localCity) || filters.city || '上海';
      try {
        const remote = await fetchLocationReverse(coords.latitude, coords.longitude);
        const remoteCity = normalizeCityName(remote.city);
        if (remoteCity) {
          resolvedCity = remoteCity;
        }
      } catch {
        // Keep local reverse-geocode results.
      }

      setCity(resolvedCity);
      setLocation(coords.latitude, coords.longitude);
    } finally {
      setPanelLocating(false);
    }
  }, [filters.city, locateCurrentCoordinates, panelLocating, setCity, setLocation]);

  const backdropTop = activePanel === 'search' ? searchPanelTop : dropdownTop;

  return (
    <SafeAreaView style={styles.page}>
      <ListHeaderBar
        city={filters.city}
        checkIn={filters.checkIn}
        checkOut={filters.checkOut}
        keywordInput={keywordInput}
        roomCount={roomCount}
        adultCount={adultCount}
        childCount={childCount}
        sortLabel={currentSortLabel}
        tagOptions={tagOptions}
        selectedTags={filters.tags}
        isSearchPanelOpen={activePanel === 'search'}
        isKeywordFocused={keywordFocused}
        isSortPanelOpen={activePanel === 'sort'}
        isFilterPanelOpen={activePanel === 'filter'}
        onBack={() => navigation.goBack()}
        onToggleSearchPanel={toggleSearchPanel}
        onToggleSortPanel={toggleSortPanel}
        onToggleFilterPanel={toggleFilterPanel}
        onChangeKeyword={onChangeKeyword}
        onFocusKeyword={onFocusKeyword}
        onSubmitKeyword={onSubmitKeyword}
        onBlurKeyword={onBlurKeyword}
        onClearKeyword={onClearKeyword}
        onToggleQuickTag={toggleQuickTag}
        onTopSearchBarLayout={setTopSearchBarHeight}
        onSortBarLayout={setSortBarHeight}
      />

      {hotelsQuery.isPending ? <AppLoading label="正在为你筛选酒店..." /> : null}
      {hotelsQuery.isError ? (
        <AppErrorState
          title="酒店列表加载失败"
          description="请检查网络或稍后重试"
          onRetry={() => {
            void hotelsQuery.refetch();
          }}
        />
      ) : null}
      {!hotelsQuery.isPending && !hotelsQuery.isError && hotels.length === 0 ? (
        <AppEmptyState title="暂无匹配酒店" description="尝试降低星级或放宽价格区间" />
      ) : null}
      {hotels.length > 0 ? (
        <FlashList
          ref={listRef}
          data={hotels}
          keyExtractor={(item) => item.id}
          renderItem={renderHotel}
          drawDistance={HOTEL_LIST_DRAW_DISTANCE}
          maintainVisibleContentPosition={{ disabled: true }}
          removeClippedSubviews={false}
          onScroll={onListScroll}
          scrollEventThrottle={16}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.25}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            hotelsQuery.isFetchingNextPage ? (
              <AppLoading label="正在加载更多..." />
            ) : hotelsQuery.hasNextPage ? null : (
              <Text style={styles.noMoreText}>没有更多酒店了</Text>
            )
          }
        />
      ) : null}

      {activePanel !== 'none' ? (
        <View style={styles.dropdownLayer} pointerEvents="box-none">
          <Pressable style={[styles.dropdownBackdrop, { top: backdropTop }]} onPress={closePanel} />

          {activePanel === 'search' ? (
            <View
              style={[styles.dropdownCardBase, styles.searchPanelCard, { top: searchPanelTop }]}
            >
              <Pressable style={styles.searchPanelLocationRow} onPress={onLocateFromSearchPanel}>
                <Text style={styles.searchPanelLocationText} numberOfLines={1}>
                  {panelLocationText}
                </Text>
                <View style={styles.searchPanelLocateButton}>
                  {panelLocating ? (
                    <ActivityIndicator size="small" color="#1570ff" />
                  ) : (
                    <Text style={styles.searchPanelLocateIcon}>⌖</Text>
                  )}
                </View>
              </Pressable>

              <Pressable style={styles.searchPanelRow} onPress={onOpenDateEditor}>
                <Text style={styles.searchPanelPrimaryText}>
                  {`${formatDisplay(filters.checkIn)} - ${formatDisplay(filters.checkOut)}`}
                </Text>
                <Text style={styles.searchPanelNightText}>{`共${nightCount}晚`}</Text>
              </Pressable>

              <Pressable style={styles.searchPanelRow} onPress={onOpenGuestEditor}>
                <Text style={styles.searchPanelPrimaryText}>
                  {`${roomCount}间房  ${adultCount}成人  ${childCount}儿童`}
                </Text>
              </Pressable>

              <Pressable style={styles.searchPanelConfirmButton} onPress={closePanel}>
                <Text style={styles.searchPanelConfirmText}>确定</Text>
              </Pressable>
            </View>
          ) : null}

          {activePanel === 'sort' ? (
            <View style={[styles.dropdownCardBase, styles.sortDropdownCard, { top: dropdownTop }]}>
              {SORT_OPTIONS.map((item) => {
                const selected = item.value === filters.sort;

                return (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.sortOptionRow,
                      !item.description ? styles.sortOptionRowCompact : null,
                    ]}
                    onPress={() => onSelectSort(item.value)}
                  >
                    <Text
                      style={[
                        styles.sortOptionTitle,
                        selected ? styles.sortOptionTitleActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.description ? (
                      <Text style={styles.sortOptionDesc}>{item.description}</Text>
                    ) : null}
                    {selected ? <Text style={styles.sortCheckMark}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {activePanel === 'filter' ? (
            <View
              style={[
                styles.dropdownCardBase,
                styles.filterDropdownCard,
                {
                  top: dropdownTop,
                  paddingBottom: spacing.sm + Math.max(insets.bottom, spacing.xs),
                },
              ]}
            >
              <ListFilterSheet
                tagOptions={tagOptions}
                draftStar={draftStar}
                draftMinPrice={draftMinPrice}
                draftMaxPrice={draftMaxPrice}
                draftTags={draftTags}
                draftFacilities={draftFacilities}
                onClose={closePanel}
                onSetDraftStar={setDraftStar}
                onSetDraftMinPrice={onSetDraftMinPrice}
                onSetDraftMaxPrice={onSetDraftMaxPrice}
                onToggleDraftTag={toggleDraftTag}
                onToggleDraftFacility={onToggleDraftFacility}
                onApply={applyFilter}
              />
            </View>
          ) : null}
        </View>
      ) : null}

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
    </SafeAreaView>
  );
}
