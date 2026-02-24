export type RootStackParamList = {
  Search: undefined;
  HotelList:
    | {
        roomCount?: number;
        adultCount?: number;
        childCount?: number;
      }
    | undefined;
  HotelDetail: { hotelId: string };
};
