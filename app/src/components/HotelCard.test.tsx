import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HotelCard } from './HotelCard';

describe('HotelCard', () => {
  it('renders hotel information and handles press', () => {
    const onPressHotel = jest.fn();

    const screen = render(
      <HotelCard
        id="hotel-1"
        nameCn="易宿海景酒店"
        nameEn="EasyHotel Seaview"
        star={5}
        city="上海"
        address="浦东新区滨江大道 88 号"
        distanceMeters={1450}
        coverImage={null}
        minPrice={699}
        description="临江景观，交通便捷"
        tags={['亲子', '免费停车']}
        onPressHotel={onPressHotel}
      />,
    );

    expect(screen.getByText('易宿海景酒店')).toBeTruthy();
    expect(screen.getByText('超棒')).toBeTruthy();
    expect(screen.getByText('699')).toBeTruthy();

    fireEvent.press(screen.getByTestId('hotel-card'));
    expect(onPressHotel).toHaveBeenCalledWith('hotel-1');
  });
});
