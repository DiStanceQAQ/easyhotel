import { useSearchStore } from '../store/searchStore';

export function useSearchFilters() {
  const city = useSearchStore((state) => state.city);
  const keyword = useSearchStore((state) => state.keyword);
  const checkIn = useSearchStore((state) => state.checkIn);
  const checkOut = useSearchStore((state) => state.checkOut);
  const lat = useSearchStore((state) => state.lat);
  const lng = useSearchStore((state) => state.lng);
  const roomCount = useSearchStore((state) => state.roomCount);
  const adultCount = useSearchStore((state) => state.adultCount);
  const childCount = useSearchStore((state) => state.childCount);
  const star = useSearchStore((state) => state.star);
  const minPrice = useSearchStore((state) => state.minPrice);
  const maxPrice = useSearchStore((state) => state.maxPrice);
  const tags = useSearchStore((state) => state.tags);
  const facilities = useSearchStore((state) => state.facilities);
  const sort = useSearchStore((state) => state.sort);

  return {
    city,
    keyword,
    checkIn,
    checkOut,
    lat,
    lng,
    roomCount,
    adultCount,
    childCount,
    star,
    minPrice,
    maxPrice,
    tags,
    facilities,
    sort,
  };
}
