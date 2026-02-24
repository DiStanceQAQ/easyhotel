import {
  AppCitiesResult,
  AppLocationReverseResult,
  AppTagsResult,
  BannerItem,
  HotelDetail,
  HotelPriceCalendarResult,
  HotelListResult,
  HotelSearchFilters,
  RoomItem,
} from '../types/api';
import { buildHotelListQuery, buildRoomsQuery } from '../utils/query';
import { getData } from './http';

export async function fetchBanners(): Promise<BannerItem[]> {
  return getData<BannerItem[]>('/app/banners');
}

export async function fetchTags(): Promise<AppTagsResult> {
  return getData<AppTagsResult>('/app/tags');
}

export async function fetchCities(): Promise<AppCitiesResult> {
  return getData<AppCitiesResult>('/app/cities');
}

export async function fetchLocationReverse(
  lat: number,
  lng: number,
): Promise<AppLocationReverseResult> {
  return getData<AppLocationReverseResult>('/app/location/reverse', {
    lat,
    lng,
  });
}

export async function fetchHotels(
  filters: HotelSearchFilters,
  page: number,
  pageSize: number,
): Promise<HotelListResult> {
  return getData<HotelListResult>('/app/hotels', buildHotelListQuery(filters, page, pageSize));
}

export async function fetchHotelDetail(hotelId: string): Promise<HotelDetail> {
  return getData<HotelDetail>(`/app/hotels/${hotelId}`);
}

export async function fetchHotelRooms(
  hotelId: string,
  filters: HotelSearchFilters,
): Promise<RoomItem[]> {
  const params = buildRoomsQuery(filters);
  return getData<RoomItem[]>(`/app/hotels/${hotelId}/rooms`, params);
}

export async function fetchHotelPriceCalendar(
  hotelId: string,
  startDate?: string,
  days = 180,
): Promise<HotelPriceCalendarResult> {
  return getData<HotelPriceCalendarResult>(`/app/hotels/${hotelId}/price-calendar`, {
    ...(startDate ? { startDate } : {}),
    days,
  });
}
