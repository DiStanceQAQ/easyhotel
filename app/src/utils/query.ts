import { HotelSearchFilters } from '../types/api';
import { isDateRangeValid } from './date';

type QueryValue = string | number;

export function buildHotelListQuery(
  filters: HotelSearchFilters,
  page: number,
  pageSize: number,
): Record<string, QueryValue> {
  const query: Record<string, QueryValue> = {
    page,
    pageSize,
    sort: filters.sort,
  };

  if (filters.city) {
    query.city = filters.city;
  }
  if (filters.keyword) {
    query.keyword = filters.keyword;
  }
  if (typeof filters.lat === 'number' && Number.isFinite(filters.lat)) {
    query.lat = filters.lat;
  }
  if (typeof filters.lng === 'number' && Number.isFinite(filters.lng)) {
    query.lng = filters.lng;
  }
  if (typeof filters.adultCount === 'number' && filters.adultCount > 0) {
    query.adults = filters.adultCount;
  }
  if (typeof filters.childCount === 'number' && filters.childCount >= 0) {
    query.children = filters.childCount;
  }
  if (typeof filters.star === 'number') {
    query.star = filters.star;
  }
  if (typeof filters.minPrice === 'number' && filters.minPrice > 0) {
    query.minPrice = filters.minPrice;
  }
  if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0) {
    query.maxPrice = filters.maxPrice;
  }
  if (filters.tags.length > 0) {
    query.tags = filters.tags.join(',');
  }
  if (filters.facilities.length > 0) {
    query.facilities = filters.facilities.join(',');
  }
  if (isDateRangeValid(filters.checkIn, filters.checkOut)) {
    query.checkIn = filters.checkIn!;
    query.checkOut = filters.checkOut!;
  }

  return query;
}

export function buildRoomsQuery(
  filters: HotelSearchFilters,
): Record<string, QueryValue> | undefined {
  if (!isDateRangeValid(filters.checkIn, filters.checkOut)) {
    return undefined;
  }

  return {
    checkIn: filters.checkIn!,
    checkOut: filters.checkOut!,
    adults: filters.adultCount,
    children: filters.childCount,
  };
}

export function serializeQuery(query?: Record<string, QueryValue>): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    params.append(key, String(value));
  });
  return params.toString();
}
