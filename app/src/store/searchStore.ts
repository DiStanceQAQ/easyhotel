import { create } from 'zustand';
import { HotelSearchFilters, SortType } from '../types/api';
import { createDefaultDateRange } from '../utils/date';

const defaultRange = createDefaultDateRange();

export type SearchStore = HotelSearchFilters & {
  setCity: (city?: string) => void;
  setKeyword: (keyword?: string) => void;
  setDates: (checkIn: string, checkOut: string) => void;
  setLocation: (lat?: number, lng?: number) => void;
  setGuestCounts: (roomCount: number, adultCount: number, childCount: number) => void;
  setStar: (star?: number) => void;
  setPriceRange: (minPrice?: number, maxPrice?: number) => void;
  toggleTag: (tag: string) => void;
  setTags: (tags: string[]) => void;
  clearTags: () => void;
  toggleFacility: (facility: string) => void;
  setFacilities: (facilities: string[]) => void;
  clearFacilities: () => void;
  setSort: (sort: SortType) => void;
  resetFilters: () => void;
};

const defaultState: HotelSearchFilters = {
  city: '上海',
  keyword: '',
  checkIn: defaultRange.checkIn,
  checkOut: defaultRange.checkOut,
  lat: undefined,
  lng: undefined,
  roomCount: 1,
  adultCount: 2,
  childCount: 0,
  star: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  tags: [],
  facilities: [],
  sort: 'default',
};

export const useSearchStore = create<SearchStore>((set) => ({
  ...defaultState,
  setCity: (city) => set({ city }),
  setKeyword: (keyword) => set({ keyword: keyword ?? '' }),
  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  setLocation: (lat, lng) => set({ lat, lng }),
  setGuestCounts: (roomCount, adultCount, childCount) => set({ roomCount, adultCount, childCount }),
  setStar: (star) => set({ star }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  toggleTag: (tag) =>
    set((state) => {
      const exists = state.tags.includes(tag);
      if (exists) {
        return { tags: state.tags.filter((item) => item !== tag) };
      }
      if (state.tags.length >= 5) {
        return state;
      }
      return { tags: [...state.tags, tag] };
    }),
  setTags: (tags) => set({ tags }),
  clearTags: () => set({ tags: [] }),
  toggleFacility: (facility) =>
    set((state) => {
      const exists = state.facilities.includes(facility);
      if (exists) {
        return { facilities: state.facilities.filter((item) => item !== facility) };
      }
      if (state.facilities.length >= 5) {
        return state;
      }
      return { facilities: [...state.facilities, facility] };
    }),
  setFacilities: (facilities) => set({ facilities }),
  clearFacilities: () => set({ facilities: [] }),
  setSort: (sort) => set({ sort }),
  resetFilters: () => set({ ...defaultState, sort: 'default' }),
}));
