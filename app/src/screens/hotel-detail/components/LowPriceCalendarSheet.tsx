import React, { memo, useMemo } from 'react';
import { Calendar, DateData } from 'react-native-calendars';
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing } from '../../../theme/tokens';
import { CALENDAR_WEEKDAY_SHORT } from '../../search/constants';
import {
  buildCalendarMonthList,
  formatCalendarMonthTitle,
  getCalendarDayLabel,
  MarkedDate,
} from '../../search/utils';

type PriceMap = Record<string, { price: number; low: boolean }>;

type Props = {
  visible: boolean;
  currentDate: string;
  minDate: string;
  markedDates: Record<string, MarkedDate>;
  canConfirmDate: boolean;
  tempNightCount: number;
  priceMap: PriceMap;
  onClose: () => void;
  onDayPress: (day: DateData) => void;
  onConfirm: () => void;
};

type DayProps = {
  date?: DateData;
  state?: string;
  marking?: MarkedDate;
  onPress?: (date?: DateData) => void;
  onLongPress?: (date?: DateData) => void;
  priceMap: PriceMap;
};

const EmptyCalendarHeader = () => null;
const MONTH_COUNT = 12;

const CALENDAR_THEME = {
  backgroundColor: colors.white,
  calendarBackground: colors.white,
  selectedDayBackgroundColor: colors.brandBlue,
  selectedDayTextColor: colors.white,
  todayTextColor: '#cf2b22',
  dayTextColor: '#1e2f46',
  textDisabledColor: '#c3cedb',
  monthTextColor: '#122843',
  textSectionTitleColor: '#25364f',
  arrowColor: '#122843',
  textMonthFontSize: 20,
  textMonthFontWeight: '700',
  textDayFontSize: 18,
  textDayHeaderFontSize: 16,
  weekVerticalMargin: 7,
} as const;

function LowPriceDayCell({ date, state, marking, onPress, onLongPress, priceMap }: DayProps) {
  if (!date) {
    return <View style={styles.dayPressable} />;
  }

  const dayLabel = getCalendarDayLabel(date.dateString);
  const topNote = state === 'today' ? '今天' : dayLabel?.label;
  const isDisabled = state === 'disabled' || !!marking?.disabled;
  const isRangeStart = !!marking?.startingDay;
  const isRangeEnd = !!marking?.endingDay;
  const isSelected = !!marking?.selected;
  const isRangeMiddle = isSelected && !isRangeStart && !isRangeEnd;
  const hasLinkedRange = !!marking?.linkedRange;
  const shouldRenderRangeFill = isRangeMiddle || (hasLinkedRange && (isRangeStart || isRangeEnd));
  const selectedEdge = isRangeStart || isRangeEnd;

  const priceItem = priceMap[date.dateString];
  const priceText = priceItem ? `¥${priceItem.price}` : '-';
  const showLowTag = !!priceItem?.low && !selectedEdge;
  const bottomNote = isRangeStart ? '入住' : isRangeEnd ? '离店' : showLowTag ? '低价' : undefined;

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      onLongPress={() => onLongPress?.(date)}
      disabled={isDisabled}
      style={styles.dayPressable}
    >
      <View style={styles.dayCell}>
        {shouldRenderRangeFill ? (
          <View
            style={[
              styles.dayRangeFill,
              isRangeMiddle ? styles.dayRangeFillMiddle : null,
              isRangeStart ? styles.dayRangeFillStart : null,
              isRangeEnd ? styles.dayRangeFillEnd : null,
            ]}
          />
        ) : null}

        {selectedEdge ? <View style={styles.daySelectedCard} /> : null}

        <View style={[styles.dayTextGroup, selectedEdge ? styles.daySelectedOffset : null]}>
          {topNote ? (
            <Text
              numberOfLines={1}
              style={[
                styles.dayTopNote,
                dayLabel?.tone === 'workday' ? styles.dayTopNoteWorkday : null,
                state === 'today' ? styles.dayTopNoteToday : null,
                selectedEdge ? styles.dayTopNoteSelected : null,
              ]}
            >
              {topNote}
            </Text>
          ) : (
            <View style={styles.dayTopPlaceholder} />
          )}

          <Text
            style={[
              styles.dayNumber,
              isDisabled ? styles.dayNumberDisabled : null,
              state === 'today' && !selectedEdge ? styles.dayNumberToday : null,
              selectedEdge ? styles.dayNumberSelected : null,
            ]}
          >
            {date.day}
          </Text>

          <Text
            style={[
              styles.dayPrice,
              selectedEdge ? styles.dayPriceSelected : null,
              isDisabled ? styles.dayPriceDisabled : null,
            ]}
          >
            {priceText}
          </Text>

          {bottomNote ? (
            <Text style={[styles.dayBottomNote, showLowTag ? styles.dayLowNote : null]}>
              {bottomNote}
            </Text>
          ) : (
            <View style={styles.dayBottomPlaceholder} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function isSameMarking(left?: MarkedDate, right?: MarkedDate) {
  return (
    left?.disabled === right?.disabled &&
    left?.selected === right?.selected &&
    left?.startingDay === right?.startingDay &&
    left?.endingDay === right?.endingDay &&
    left?.linkedRange === right?.linkedRange
  );
}

function areEqual(prev: DayProps, next: DayProps) {
  return (
    prev.state === next.state &&
    prev.date?.dateString === next.date?.dateString &&
    prev.date?.day === next.date?.day &&
    isSameMarking(prev.marking, next.marking) &&
    prev.priceMap[prev.date?.dateString ?? '']?.price ===
      next.priceMap[next.date?.dateString ?? '']?.price &&
    prev.priceMap[prev.date?.dateString ?? '']?.low ===
      next.priceMap[next.date?.dateString ?? '']?.low
  );
}

const MemoLowPriceDayCell = memo(LowPriceDayCell, areEqual);

export function LowPriceCalendarSheet({
  visible,
  currentDate,
  minDate,
  markedDates,
  canConfirmDate,
  tempNightCount,
  priceMap,
  onClose,
  onDayPress,
  onConfirm,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const bodyHeight = useMemo(
    () => Math.max(520, Math.min(900, Math.floor(windowHeight * 0.82))),
    [windowHeight],
  );
  const monthList = useMemo(
    () => (visible ? buildCalendarMonthList(currentDate || minDate, MONTH_COUNT) : []),
    [currentDate, minDate, visible],
  );

  const renderMonth = ({ item: monthStart }: ListRenderItemInfo<string>) => (
    <View style={styles.monthBlock}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>{formatCalendarMonthTitle(monthStart)}</Text>
      </View>
      <Calendar
        key={monthStart}
        style={styles.calendar}
        markingType="period"
        markedDates={markedDates}
        current={monthStart}
        minDate={minDate}
        onDayPress={onDayPress}
        customHeader={EmptyCalendarHeader}
        dayComponent={(props) => <MemoLowPriceDayCell {...props} priceMap={priceMap} />}
        hideArrows
        hideDayNames
        hideExtraDays
        disableMonthChange
        monthFormat="yyyy年M月"
        firstDay={0}
        theme={CALENDAR_THEME}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.mask}>
        <View style={[styles.sheet, { height: bodyHeight }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>低价日历</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipText}>*以下价格为单晚入住参考价</Text>
          </View>

          <View style={styles.weekRow}>
            {CALENDAR_WEEKDAY_SHORT.map((label, index) => (
              <View key={label} style={styles.weekCell}>
                <Text
                  style={[styles.weekText, index === 0 || index === 6 ? styles.weekWeekend : null]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <FlatList
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            data={monthList}
            keyExtractor={(item) => item}
            renderItem={renderMonth}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={4}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            onPress={onConfirm}
            disabled={!canConfirmDate}
            style={[styles.doneButton, !canConfirmDate ? styles.doneButtonDisabled : null]}
          >
            <Text style={styles.doneText}>
              {canConfirmDate ? `完成 (${tempNightCount}晚)` : '完成'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#1f314a',
    fontSize: 28,
    lineHeight: 28,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  tipRow: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#fff7ef',
  },
  tipText: {
    color: '#c6801f',
    fontSize: 14,
    fontWeight: '600',
  },
  weekRow: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekText: {
    color: '#1a1d24',
    fontSize: 16,
    fontWeight: '600',
  },
  weekWeekend: {
    color: '#d34d4b',
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  monthBlock: {
    backgroundColor: colors.white,
  },
  monthHeader: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
  },
  monthTitle: {
    color: '#121212',
    fontSize: 23,
    fontWeight: '700',
  },
  calendar: {
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    paddingTop: spacing.xs,
    paddingBottom: 2,
  },
  dayPressable: {
    width: '100%',
    alignItems: 'center',
  },
  dayCell: {
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    position: 'relative',
  },
  dayRangeFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    bottom: 8,
    backgroundColor: '#d3e0f2',
  },
  dayRangeFillMiddle: {
    left: 0,
    right: 0,
  },
  dayRangeFillStart: {
    left: '50%',
    right: 0,
  },
  dayRangeFillEnd: {
    left: 0,
    right: '50%',
  },
  daySelectedCard: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    bottom: 8,
    borderRadius: 10,
    backgroundColor: '#1672ff',
  },
  daySelectedOffset: {
    marginTop: 2,
  },
  dayTextGroup: {
    alignItems: 'center',
  },
  dayTopPlaceholder: {
    minHeight: 15,
  },
  dayTopNote: {
    minHeight: 15,
    color: '#b2bac5',
    fontSize: 11,
    lineHeight: 15,
    zIndex: 2,
  },
  dayTopNoteWorkday: {
    color: '#2b3546',
  },
  dayTopNoteToday: {
    color: '#7e8fa8',
  },
  dayTopNoteSelected: {
    color: '#d7e7ff',
  },
  dayNumber: {
    marginTop: 0,
    color: '#131f31',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    zIndex: 2,
  },
  dayNumberToday: {
    color: '#cf2b22',
  },
  dayNumberDisabled: {
    color: '#c1c8d3',
  },
  dayNumberSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dayPrice: {
    marginTop: 1,
    color: '#1f2f46',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    zIndex: 2,
  },
  dayPriceSelected: {
    color: colors.white,
  },
  dayPriceDisabled: {
    color: '#c7cfda',
  },
  dayBottomNote: {
    marginTop: 0,
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    zIndex: 2,
  },
  dayLowNote: {
    color: '#cf2b22',
  },
  dayBottomPlaceholder: {
    minHeight: 14,
  },
  doneButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#126fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: '#8ab7ff',
  },
  doneText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
