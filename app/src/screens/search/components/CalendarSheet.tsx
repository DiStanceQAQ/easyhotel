import React, { useMemo } from 'react';
import { Calendar, DateData } from 'react-native-calendars';
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../../theme/tokens';
import { CALENDAR_WEEKDAY_SHORT } from '../constants';
import { searchStyles as styles } from '../styles';
import { buildCalendarMonthList, formatCalendarMonthTitle, MarkedDate } from '../utils';
import { MemoCalendarDayCell } from './CalendarDayCell';

type Props = {
  visible: boolean;
  sheetStyle: StyleProp<ViewStyle>;
  currentDate: string;
  minDate: string;
  markedDates: Record<string, MarkedDate>;
  canConfirmDate: boolean;
  tempNightCount: number;
  onClose: () => void;
  onDayPress: (day: DateData) => void;
  onConfirm: () => void;
};

const EmptyCalendarHeader = () => null;
const CALENDAR_INITIAL_MONTH_COUNT = 2;
const CALENDAR_THEME = {
  backgroundColor: colors.white,
  calendarBackground: colors.white,
  selectedDayBackgroundColor: colors.brandBlue,
  selectedDayTextColor: colors.white,
  todayTextColor: colors.brandBlue,
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

export function CalendarSheet({
  visible,
  sheetStyle,
  currentDate,
  minDate,
  markedDates,
  canConfirmDate,
  tempNightCount,
  onClose,
  onDayPress,
  onConfirm,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();

  const monthList = useMemo(
    () => (visible ? buildCalendarMonthList(currentDate || minDate, 12) : []),
    [currentDate, minDate, visible],
  );

  const bodyHeight = useMemo(
    () => Math.max(460, Math.min(760, Math.floor(windowHeight * 0.74))),
    [windowHeight],
  );

  const renderMonth = ({ item: monthStart }: ListRenderItemInfo<string>) => (
    <View style={styles.calendarMonthBlock}>
      <View style={styles.calendarMonthHeader}>
        <Text style={styles.calendarMonthTitle}>{formatCalendarMonthTitle(monthStart)}</Text>
      </View>
      <Calendar
        key={monthStart}
        style={styles.calendarList}
        markingType="period"
        markedDates={markedDates}
        current={monthStart}
        minDate={minDate}
        onDayPress={onDayPress}
        customHeader={EmptyCalendarHeader}
        dayComponent={MemoCalendarDayCell}
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
      <View style={styles.modalMaskBottom}>
        <View style={sheetStyle}>
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </Pressable>
            <View style={styles.calendarModeTabs}>
              <View style={[styles.calendarModeTab, styles.calendarModeTabActive]}>
                <Text style={[styles.calendarModeText, styles.calendarModeTextActive]}>
                  指定日期
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.calendarBody, { height: bodyHeight }]}>
            <View style={styles.calendarWeekRow}>
              {CALENDAR_WEEKDAY_SHORT.map((label, index) => (
                <View key={label} style={styles.calendarWeekCell}>
                  <Text
                    style={[
                      styles.calendarWeekText,
                      index === 0 || index === 6 ? styles.calendarWeekTextWeekend : null,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            <FlatList
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarScrollContent}
              data={monthList}
              keyExtractor={(item) => item}
              renderItem={renderMonth}
              initialNumToRender={CALENDAR_INITIAL_MONTH_COUNT}
              maxToRenderPerBatch={CALENDAR_INITIAL_MONTH_COUNT}
              windowSize={4}
              removeClippedSubviews
              showsVerticalScrollIndicator={false}
            />
          </View>

          <Pressable
            onPress={onConfirm}
            disabled={!canConfirmDate}
            style={[
              styles.calendarDoneButton,
              !canConfirmDate ? styles.calendarDoneButtonDisabled : null,
            ]}
          >
            <Text style={styles.calendarDoneText}>
              {canConfirmDate ? `完成 (${tempNightCount}晚)` : '完成'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
