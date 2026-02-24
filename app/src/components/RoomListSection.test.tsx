import React from 'react';
import { render } from '@testing-library/react-native';
import { RoomListSection } from './RoomListSection';

describe('RoomListSection', () => {
  it('renders room cards', () => {
    const screen = render(
      <RoomListSection
        rooms={[
          {
            id: 1,
            name: '高级大床房',
            basePrice: 399,
            currency: 'CNY',
            maxGuests: 2,
            breakfast: true,
            refundable: true,
            areaM2: 32,
            coverImage: null,
            stock: 4,
            totalPrice: 798,
          },
          {
            id: 2,
            name: '豪华套房',
            basePrice: 899,
            currency: 'CNY',
            maxGuests: 3,
            breakfast: true,
            refundable: false,
            areaM2: 56,
            coverImage: null,
            stock: 2,
            totalPrice: 1798,
          },
        ]}
      />,
    );

    expect(screen.getByText('房型选择')).toBeTruthy();
    expect(screen.getByText('高级大床房')).toBeTruthy();
    expect(screen.getByText('豪华套房')).toBeTruthy();
  });

  it('renders empty hint for empty rooms', () => {
    const screen = render(<RoomListSection rooms={[]} />);
    expect(screen.getByText('当前日期暂无可售房型')).toBeTruthy();
  });
});
