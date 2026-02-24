import { SortType } from '../../types/api';

export const PAGE_SIZE = 10;

export const FALLBACK_TAGS = [
  { id: 'local-1', name: '双床房' },
  { id: 'local-2', name: '免费停车场' },
  { id: 'local-3', name: '近地铁' },
  { id: 'local-4', name: '4.7分以上' },
  { id: 'local-5', name: '电竞酒店' },
];

export const SORT_OPTIONS: Array<{
  value: SortType;
  label: string;
  description?: string;
}> = [
  { value: 'default', label: '默认排序', description: '按创建时间倒序（最新优先）' },
  { value: 'distance_asc', label: '距离优先', description: '按当前位置直线距离由近到远' },
  { value: 'price_asc', label: '低价优先' },
  { value: 'price_desc', label: '高价优先' },
  { value: 'star_desc', label: '高星优先' },
];

export const SORT_LABEL_MAP: Record<SortType, string> = {
  default: '智能排序',
  distance_asc: '距离优先',
  rating_desc: '智能排序',
  price_asc: '低价优先',
  price_desc: '高价优先',
  star_desc: '高星优先',
};

export const FACILITY_OPTIONS = [
  { key: 'wifi', label: '免费WiFi' },
  { key: 'parking', label: '免费停车' },
  { key: 'gym', label: '健身房' },
  { key: 'pool', label: '泳池' },
  { key: 'restaurant', label: '餐厅' },
] as const;
