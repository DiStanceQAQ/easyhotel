export type SortType =
  | 'default'
  | 'rating_desc'
  | 'price_asc'
  | 'price_desc'
  | 'star_desc'
  | 'distance_asc';

export type ResponseEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  requestId?: string;
};

export type BannerItem = {
  id: number;
  title: string | null;
  imageUrl: string;
  hotelId: string;
  sortOrder: number;
};

export type AppLocationReverseResult = {
  city: string | null;
  district: string | null;
  nearby: string | null;
  formattedAddress: string | null;
  source: 'amap' | 'fallback';
};

export type AppTagItem = {
  id: string;
  name: string;
};

export type AppTagsResult = {
  list: AppTagItem[];
  total: number;
};

export type AppCityItem = {
  city: string;
  hotelCount: number;
};

export type AppCitiesResult = {
  list: AppCityItem[];
  total: number;
};

export type HotelListItem = {
  id: string;
  nameCn: string;
  nameEn: string;
  star: number;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  coverImage: string | null;
  minPrice: number | null;
  description: string | null;
  tags: string[];
  distanceMeters: number | null;
};

export type HotelListResult = {
  list: HotelListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type HotelImageItem = {
  id: number;
  url: string;
  sortOrder: number;
};

export type HotelDetail = {
  id: string;
  nameCn: string;
  nameEn: string;
  star: number;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  openedAt: string;
  facilities: unknown;
  tags: string[];
  images: HotelImageItem[];
  minPrice: number | null;
  coverImage: string | null;
  description: string | null;
  contactPhone: string | null;
};

export type RoomItem = {
  id: number;
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  breakfast: boolean;
  refundable: boolean;
  areaM2: number | null;
  coverImage: string | null;
  stock: number | null;
  totalPrice: number | null;
};

export type HotelPriceCalendarItem = {
  date: string;
  minPrice: number | null;
  hasStock: boolean;
  low: boolean;
};

export type HotelPriceCalendarResult = {
  startDate: string;
  endDate: string;
  list: HotelPriceCalendarItem[];
};

export type HotelSearchFilters = {
  city?: string;
  keyword?: string;
  checkIn?: string;
  checkOut?: string;
  lat?: number;
  lng?: number;
  roomCount: number;
  adultCount: number;
  childCount: number;
  star?: number;
  minPrice?: number;
  maxPrice?: number;
  tags: string[];
  facilities: string[];
  sort: SortType;
};
