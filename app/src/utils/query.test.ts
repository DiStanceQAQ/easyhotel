import { HotelSearchFilters } from '../types/api';
import { buildHotelListQuery, buildRoomsQuery, serializeQuery } from './query';

const baseFilters: HotelSearchFilters = {
  city: '上海',
  keyword: '外滩',
  checkIn: '2026-02-10',
  checkOut: '2026-02-12',
  lat: 31.2304,
  lng: 121.4737,
  roomCount: 1,
  adultCount: 2,
  childCount: 1,
  star: 5,
  minPrice: 300,
  maxPrice: 900,
  tags: ['亲子', '免费停车'],
  facilities: ['parking', 'wifi'],
  sort: 'price_asc',
};

describe('query utils', () => {
  it('builds hotel list query with filters and pagination', () => {
    const query = buildHotelListQuery(baseFilters, 2, 10);

    expect(query).toEqual({
      city: '上海',
      keyword: '外滩',
      checkIn: '2026-02-10',
      checkOut: '2026-02-12',
      lat: 31.2304,
      lng: 121.4737,
      adults: 2,
      children: 1,
      star: 5,
      minPrice: 300,
      maxPrice: 900,
      tags: '亲子,免费停车',
      facilities: 'parking,wifi',
      sort: 'price_asc',
      page: 2,
      pageSize: 10,
    });
  });

  it('omits invalid date range from rooms query', () => {
    const query = buildRoomsQuery({
      ...baseFilters,
      checkIn: '2026-02-10',
      checkOut: '2026-02-10',
    });

    expect(query).toBeUndefined();
  });

  it('omits non-positive price bounds from hotel list query', () => {
    const query = buildHotelListQuery(
      {
        ...baseFilters,
        minPrice: 0,
        maxPrice: 0,
      },
      1,
      10,
    );

    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
  });

  it('serializes query object', () => {
    const serialized = serializeQuery({ city: '上海', page: 1, sort: 'default' });
    expect(serialized).toContain('city=%E4%B8%8A%E6%B5%B7');
    expect(serialized).toContain('page=1');
    expect(serialized).toContain('sort=default');
  });
});
