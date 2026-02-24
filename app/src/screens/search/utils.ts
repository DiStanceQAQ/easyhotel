import { LocaleConfig } from 'react-native-calendars';
import { colors } from '../../theme/tokens';
import { formatDate } from '../../utils/date';
import {
  CALENDAR_FESTIVAL_MAP,
  CALENDAR_SOLAR_FESTIVAL_MAP,
  CALENDAR_WORKDAY_MAP,
  WEEK_LABELS,
} from './constants';

export type MarkedDate = {
  selected?: boolean;
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  linkedRange?: boolean;
};

export type CalendarDayLabel = {
  label: string;
  tone: 'workday' | 'festival' | 'rest';
};

LocaleConfig.locales.zh = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
  today: '今天',
};
LocaleConfig.defaultLocale = 'zh';

export function buildMarkedDates(checkIn?: string, checkOut?: string) {
  const marked: Record<string, MarkedDate> = {};

  if (!checkIn) {
    return marked;
  }

  marked[checkIn] = {
    selected: true,
    startingDay: true,
    color: colors.brandBlue,
    textColor: colors.white,
  };

  if (!checkOut || checkOut <= checkIn) {
    return marked;
  }

  const cursor = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);

  while (cursor <= end) {
    const value = formatDate(cursor);
    const isStart = value === checkIn;
    const isEnd = value === checkOut;

    marked[value] = {
      selected: true,
      startingDay: isStart,
      endingDay: isEnd,
      color: colors.brandBlue,
      textColor: colors.white,
      linkedRange: true,
    };

    cursor.setDate(cursor.getDate() + 1);
  }

  return marked;
}

export function formatDisplay(date?: string) {
  if (!date) {
    return '--';
  }

  const current = new Date(`${date}T00:00:00`);
  if (Number.isNaN(current.getTime())) {
    return '--';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const normalized = new Date(current);
  normalized.setHours(0, 0, 0, 0);

  let suffix = WEEK_LABELS[current.getDay()];
  if (normalized.getTime() === today.getTime()) {
    suffix = '今天';
  } else if (normalized.getTime() === tomorrow.getTime()) {
    suffix = '明天';
  }

  return `${current.getMonth() + 1}月${current.getDate()}日 ${suffix}`;
}

export function parsePositiveNumber(value: string): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getTodayDateString() {
  return formatDate(new Date());
}

export function formatCalendarMonthTitle(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function buildCalendarMonthList(startDate: string, totalMonthCount = 12): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || totalMonthCount <= 0) {
    return [];
  }

  start.setDate(1);
  const monthList: string[] = [];

  for (let index = 0; index < totalMonthCount; index += 1) {
    const month = new Date(start);
    month.setMonth(start.getMonth() + index);
    monthList.push(formatDate(month));
  }

  return monthList;
}

export function getCalendarDayLabel(dateString: string): CalendarDayLabel | undefined {
  const workdayLabel = CALENDAR_WORKDAY_MAP[dateString];
  const festivalLabel = CALENDAR_FESTIVAL_MAP[dateString];
  const monthDay = dateString.slice(5);
  const solarFestivalLabel = CALENDAR_SOLAR_FESTIVAL_MAP[monthDay];
  const resolvedFestivalLabel = festivalLabel ?? solarFestivalLabel;

  if (workdayLabel && resolvedFestivalLabel) {
    return { label: `${workdayLabel}/${resolvedFestivalLabel}`, tone: 'festival' };
  }

  if (workdayLabel) {
    return { label: workdayLabel, tone: 'workday' };
  }

  if (resolvedFestivalLabel) {
    return { label: resolvedFestivalLabel, tone: 'festival' };
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) {
    return { label: '休', tone: 'rest' };
  }

  return undefined;
}
