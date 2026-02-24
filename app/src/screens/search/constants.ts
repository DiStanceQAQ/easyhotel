import { AppCityItem, AppTagItem } from '../../types/api';

export const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const CALENDAR_WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export const CALENDAR_WORKDAY_MAP: Record<string, string> = {
  '2026-02-14': '班',
  '2026-02-28': '班',
};

export const CALENDAR_FESTIVAL_MAP: Record<string, string> = {
  '2026-02-16': '除夕',
  '2026-02-17': '春节',
  '2026-03-03': '元宵',
};

export const CALENDAR_SOLAR_FESTIVAL_MAP: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '05-01': '劳动节',
  '06-01': '儿童节',
  '10-01': '国庆节',
  '12-25': '圣诞节',
};

export const STAR_PANEL_OPTIONS = [
  { value: 2, label: '2钻/星及以下', desc: '经济' },
  { value: 3, label: '3钻/星', desc: '舒适' },
  { value: 4, label: '4钻/星', desc: '高档' },
  { value: 5, label: '5钻/星', desc: '豪华' },
] as const;

export const PRICE_PRESET_OPTIONS: Array<{ label: string; min?: number; max?: number }> = [
  { label: '¥200以下', max: 200 },
  { label: '¥200-¥300', min: 200, max: 300 },
  { label: '¥300-¥350', min: 300, max: 350 },
  { label: '¥350-¥400', min: 350, max: 400 },
  { label: '¥400-¥600', min: 400, max: 600 },
  { label: '¥600-¥750', min: 600, max: 750 },
  { label: '¥750-¥850', min: 750, max: 850 },
  { label: '¥850以上', min: 850 },
];

export const PRICE_SLIDER_MIN = 0;
export const PRICE_SLIDER_MAX = 850;

export const FALLBACK_TAGS: AppTagItem[] = [
  { id: 'local-1', name: '双床房' },
  { id: 'local-2', name: '免费停车场' },
  { id: 'local-3', name: '4.7分以上' },
  { id: 'local-4', name: '近地铁' },
  { id: 'local-5', name: '可订' },
];

export const FALLBACK_CITIES: AppCityItem[] = [
  { city: '上海', hotelCount: 0 },
  { city: '广州', hotelCount: 0 },
  { city: '北京', hotelCount: 0 },
  { city: '深圳', hotelCount: 0 },
  { city: '杭州', hotelCount: 0 },
  { city: '南昌', hotelCount: 0 },
];
