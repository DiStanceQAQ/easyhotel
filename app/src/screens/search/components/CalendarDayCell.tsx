import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { searchStyles as styles } from '../styles';
import { getCalendarDayLabel, MarkedDate } from '../utils';

type Props = {
  date?: DateData;
  state?: string;
  marking?: MarkedDate;
  onPress?: (date?: DateData) => void;
  onLongPress?: (date?: DateData) => void;
};

export function CalendarDayCell({ date, state, marking, onPress, onLongPress }: Props) {
  if (!date) {
    return <View style={styles.calendarDayPressable} />;
  }

  const isDisabled = state === 'disabled' || !!marking?.disabled;
  const isToday = state === 'today';
  const isRangeStart = !!marking?.startingDay;
  const isRangeEnd = !!marking?.endingDay;
  const isSelected = !!marking?.selected;
  const isRangeMiddle = isSelected && !isRangeStart && !isRangeEnd;
  const hasLinkedRange = !!marking?.linkedRange;
  const shouldRenderRangeFill = isRangeMiddle || (hasLinkedRange && (isRangeStart || isRangeEnd));
  const dayLabel = getCalendarDayLabel(date.dateString);

  const topNote = isToday ? '今天' : dayLabel?.label;
  const bottomNote = isRangeStart ? '入住' : isRangeEnd ? '离店' : undefined;

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      onLongPress={() => onLongPress?.(date)}
      disabled={isDisabled}
      style={styles.calendarDayPressable}
    >
      <View style={styles.calendarDayCell}>
        {shouldRenderRangeFill ? (
          <View
            style={[
              styles.calendarDayRangeFill,
              isRangeMiddle ? styles.calendarDayRangeFillMiddle : null,
              isRangeStart ? styles.calendarDayRangeFillStart : null,
              isRangeEnd ? styles.calendarDayRangeFillEnd : null,
            ]}
          />
        ) : null}

        {isRangeStart || isRangeEnd ? <View style={styles.calendarDaySelectedCard} /> : null}

        <View
          style={[
            styles.calendarDayTextGroup,
            isRangeStart || isRangeEnd ? styles.calendarDaySelectedOffset : null,
          ]}
        >
          {topNote ? (
            <Text
              numberOfLines={1}
              style={[
                styles.calendarDayTopNote,
                dayLabel?.tone === 'workday' ? styles.calendarDayTopNoteWorkday : null,
                dayLabel?.tone === 'festival' ? styles.calendarDayTopNoteFestival : null,
                dayLabel?.tone === 'rest' ? styles.calendarDayTopNoteRest : null,
                isToday && !isRangeStart && !isRangeEnd ? styles.calendarDayTopNoteToday : null,
                isToday && (isRangeStart || isRangeEnd) ? styles.calendarDayTopNoteSelected : null,
                isRangeStart || isRangeEnd ? styles.calendarDayTopNoteSelected : null,
              ]}
            >
              {topNote}
            </Text>
          ) : (
            <View style={styles.calendarDayTopPlaceholder} />
          )}

          <Text
            style={[
              styles.calendarDayNumber,
              isDisabled ? styles.calendarDayNumberDisabled : null,
              isToday && !isRangeStart && !isRangeEnd ? styles.calendarDayNumberToday : null,
              isRangeStart || isRangeEnd ? styles.calendarDayNumberSelected : null,
            ]}
          >
            {date.day}
          </Text>

          {bottomNote ? <Text style={styles.calendarDayBottomNote}>{bottomNote}</Text> : null}
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

function areEqual(prev: Props, next: Props) {
  return (
    prev.state === next.state &&
    prev.date?.dateString === next.date?.dateString &&
    prev.date?.day === next.date?.day &&
    isSameMarking(prev.marking, next.marking) &&
    prev.onPress === next.onPress &&
    prev.onLongPress === next.onLongPress
  );
}

export const MemoCalendarDayCell = memo(CalendarDayCell, areEqual);
