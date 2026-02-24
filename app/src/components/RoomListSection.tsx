import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoomItem } from '../types/api';
import { colors, spacing } from '../theme/tokens';
import { RoomCard } from './RoomCard';

type RoomListSectionProps = {
  rooms: RoomItem[];
};

export function RoomListSection({ rooms }: RoomListSectionProps) {
  if (rooms.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>当前日期暂无可售房型</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>房型选择</Text>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          name={room.name}
          basePrice={room.basePrice}
          currency={room.currency}
          maxGuests={room.maxGuests}
          breakfast={room.breakfast}
          refundable={room.refundable}
          areaM2={room.areaM2}
          coverImage={room.coverImage}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    color: colors.ink900,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.ink500,
    fontSize: 13,
  },
});
