import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppEmptyState } from '../../../components/AppEmptyState';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoading } from '../../../components/AppLoading';
import { HotelDetail } from '../../../types/api';
import { formatDisplayDate } from '../../../utils/date';
import { getOpenedYear } from '../utils';
import { hotelDetailStyles as styles } from '../styles';

type Props = {
  detail: HotelDetail;
  facilityLabels: string[];
  checkIn?: string;
  checkOut?: string;
  dateHint: string;
  roomCount: number;
  adultCount: number;
  childCount: number;
  filterTags: string[];
  distanceText: string;
  nightCount: number;
  roomsPending: boolean;
  roomsError: boolean;
  roomsLength: number;
  onPressMap: () => void;
  onOpenLowPriceCalendar: () => void;
  onOpenGuestEditor: () => void;
  onRetryRooms: () => void;
};

export function DetailInfoCard({
  detail,
  facilityLabels,
  checkIn,
  checkOut,
  dateHint,
  roomCount,
  adultCount,
  childCount,
  filterTags,
  distanceText,
  nightCount,
  roomsPending,
  roomsError,
  roomsLength,
  onPressMap,
  onOpenLowPriceCalendar,
  onOpenGuestEditor,
  onRetryRooms,
}: Props) {
  const starCount = Math.max(0, Math.min(5, Math.round(detail.star || 0)));
  const starMarks = starCount > 0 ? `${'★'.repeat(starCount)}${'☆'.repeat(5 - starCount)}` : null;
  const openedYear = getOpenedYear(detail.openedAt);
  const visibleFacilities = useMemo(() => facilityLabels.slice(0, 5), [facilityLabels]);
  const hiddenFacilityCount = Math.max(0, facilityLabels.length - visibleFacilities.length);
  const [checkInHint = '--', checkOutHint = '--'] = dateHint.split(' - ');
  const hasAddress = typeof detail.address === 'string' && detail.address.trim().length > 0;
  const canOpenMap = typeof detail.lat === 'number' && typeof detail.lng === 'number';
  const nightText = nightCount > 0 ? `共${nightCount}晚` : '请选择离店日期';
  const guestValues = useMemo(() => {
    const values = [`${roomCount}间`, `${adultCount}人`];
    if (childCount > 0) {
      values.push(`${childCount}童`);
    }
    return values;
  }, [adultCount, childCount, roomCount]);

  return (
    <View style={styles.mainCard}>
      <View style={styles.titleRow}>
        <Text style={styles.hotelName}>{detail.nameCn}</Text>
        {starMarks ? <Text style={styles.diamond}>{starMarks}</Text> : null}
      </View>

      <View style={styles.badgeRow}>
        {openedYear != null ? (
          <View style={styles.smallBadge}>
            <Text style={styles.smallBadgeText}>{`${openedYear}年开业`}</Text>
          </View>
        ) : null}
        {detail.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={styles.smallBadge}>
            <Text style={styles.smallBadgeText}>{tag}</Text>
          </View>
        ))}
      </View>

      {visibleFacilities.length > 0 ? (
        <View style={styles.facilityRow}>
          {visibleFacilities.map((item) => (
            <View key={item} style={styles.facilityChip}>
              <Text style={styles.facilityLabel}>{item}</Text>
            </View>
          ))}
          {hiddenFacilityCount > 0 ? (
            <View style={styles.facilitySummary}>
              <Text style={styles.facilityMoreText}>{`等${hiddenFacilityCount}项设施`}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.reviewCardRow}>
        <View style={[styles.reviewCard, !hasAddress ? styles.reviewCardFull : null]}>
          <Text style={styles.reviewTopText}>酒店星级</Text>
          <Text style={styles.realInfoPrimary}>{detail.star > 0 ? `${detail.star}星酒店` : '舒适酒店'}</Text>
          <Text style={styles.realInfoSecondary} numberOfLines={1}>
            {detail.city}
          </Text>
        </View>

        {hasAddress ? (
          <Pressable
            style={[styles.mapCard, !canOpenMap ? styles.mapCardDisabled : null]}
            onPress={onPressMap}
            disabled={!canOpenMap}
          >
            <Text style={styles.mapDistance}>{distanceText}</Text>
            <Text style={styles.mapAddress} numberOfLines={2}>
              {detail.address}
            </Text>
            {canOpenMap ? <Text style={styles.mapLink}>查看地图</Text> : null}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.datePanel}>
        <View style={styles.dateEditorRow}>
          <Pressable style={styles.dateEditorLeft} onPress={onOpenLowPriceCalendar}>
            <View style={styles.dateMainRow}>
              <Text style={styles.dateText}>
                {`${formatDisplayDate(checkIn)} - ${formatDisplayDate(checkOut)}`}
              </Text>
            </View>
            <Text style={styles.dateHintLabel}>{`${checkInHint} - ${checkOutHint} · ${nightText}`}</Text>
          </Pressable>

          <View style={styles.dateEditorDivider} />

          <Pressable style={styles.guestEditorRight} onPress={onOpenGuestEditor}>
            <Text style={styles.guestEditorLabel}>间数人数</Text>
            <View style={styles.guestEditorValueRow}>
              {guestValues.map((value, index) => (
                <Text key={`${value}-${index}`} style={styles.guestEditorValue}>
                  {value}
                </Text>
              ))}
            </View>
          </Pressable>
        </View>

        {filterTags.length > 0 ? (
          <View style={styles.bottomTagRow}>
            {filterTags.slice(0, 4).map((tag) => (
              <View key={tag} style={styles.bottomTag}>
                <Text style={styles.bottomTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>推荐房型</Text>

      {roomsPending ? <AppLoading label="正在拉取房型..." /> : null}
      {roomsError ? (
        <AppErrorState title="房型加载失败" description="可下拉刷新重试" onRetry={onRetryRooms} />
      ) : null}
      {!roomsPending && !roomsError && roomsLength === 0 ? (
        <AppEmptyState title="暂无可售房型" description="请更换日期后重试" />
      ) : null}
    </View>
  );
}
