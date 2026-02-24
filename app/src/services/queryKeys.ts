export const queryKeys = {
  banners: () => ['app', 'banners'] as const,
  tags: () => ['app', 'tags'] as const,
  cities: () => ['app', 'cities'] as const,
  hotels: (fingerprint: string) => ['app', 'hotels', fingerprint] as const,
  hotelDetail: (hotelId: string) => ['app', 'hotels', hotelId, 'detail'] as const,
  rooms: (hotelId: string, dateRange: string) =>
    ['app', 'hotels', hotelId, 'rooms', dateRange] as const,
  roomPriceCalendar: (hotelId: string, startDate: string, days: number) =>
    ['app', 'hotels', hotelId, 'price-calendar', startDate, days] as const,
};
