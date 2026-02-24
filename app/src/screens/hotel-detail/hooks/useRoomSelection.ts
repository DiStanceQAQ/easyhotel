import { useCallback, useEffect, useMemo, useState } from 'react';
import { RoomItem } from '../../../types/api';

const ROOM_TYPE_MAX_SELECTION = 9;

function getRoomTypeMaxSelectable(room: RoomItem): number {
  const stockLimit =
    typeof room.stock === 'number' && Number.isFinite(room.stock)
      ? Math.max(0, Math.floor(room.stock))
      : ROOM_TYPE_MAX_SELECTION;
  return Math.min(ROOM_TYPE_MAX_SELECTION, stockLimit);
}

function buildNormalizedRoomSelection(
  source: Record<number, number>,
  rooms: RoomItem[],
  roomTarget: number,
): Record<number, number> {
  const next: Record<number, number> = {};

  rooms.forEach((room) => {
    const raw = Math.floor(source[room.id] ?? 0);
    const value = Math.max(0, Math.min(getRoomTypeMaxSelectable(room), raw));
    if (value > 0) {
      next[room.id] = value;
    }
  });

  const safeTarget = Math.max(0, roomTarget);
  const total = Object.values(next).reduce((sum, value) => sum + value, 0);
  if (total <= safeTarget) {
    return next;
  }

  let overflow = total - safeTarget;
  const roomIds = Object.keys(next)
    .map((id) => Number(id))
    .sort((left, right) => (next[right] ?? 0) - (next[left] ?? 0));

  roomIds.forEach((roomId) => {
    if (overflow <= 0) {
      return;
    }

    const current = next[roomId] ?? 0;
    if (current <= 0) {
      return;
    }

    const reduceCount = Math.min(current, overflow);
    const remain = current - reduceCount;
    if (remain > 0) {
      next[roomId] = remain;
    } else {
      delete next[roomId];
    }
    overflow -= reduceCount;
  });

  return next;
}

function isSameRoomSelection(left: Record<number, number>, right: Record<number, number>): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[Number(key)] === right[Number(key)]);
}

type Params = {
  rooms: RoomItem[];
  roomTarget: number;
  guestTarget: number;
  nightCount: number;
};

export function useRoomSelection({ rooms, roomTarget, guestTarget, nightCount }: Params) {
  const [roomSelection, setRoomSelection] = useState<Record<number, number>>({});

  const roomMaxById = useMemo(() => {
    const map: Record<number, number> = {};
    rooms.forEach((room) => {
      map[room.id] = getRoomTypeMaxSelectable(room);
    });
    return map;
  }, [rooms]);

  useEffect(() => {
    setRoomSelection((current) => {
      const normalized = buildNormalizedRoomSelection(current, rooms, roomTarget);
      if (isSameRoomSelection(current, normalized)) {
        return current;
      }
      return normalized;
    });
  }, [roomTarget, rooms]);

  const onChangeRoomQuantity = useCallback(
    (roomId: number, delta: 1 | -1) => {
      const roomMax = roomMaxById[roomId];
      if (typeof roomMax !== 'number') {
        return;
      }

      setRoomSelection((current) => {
        const currentCount = current[roomId] ?? 0;
        const currentTotal = Object.values(current).reduce((sum, count) => sum + count, 0);
        let nextCount = Math.max(0, Math.min(roomMax, currentCount + delta));

        if (delta > 0 && currentTotal >= roomTarget) {
          return current;
        }

        if (delta > 0) {
          const remainRoom = Math.max(0, roomTarget - currentTotal);
          nextCount = Math.min(nextCount, currentCount + remainRoom);
        }

        const next = { ...current };
        if (nextCount > 0) {
          next[roomId] = nextCount;
        } else {
          delete next[roomId];
        }

        return next;
      });
    },
    [roomMaxById, roomTarget],
  );

  const increaseHandlers = useMemo(() => {
    const handlers: Record<number, () => void> = {};
    rooms.forEach((room) => {
      handlers[room.id] = () => onChangeRoomQuantity(room.id, 1);
    });
    return handlers;
  }, [onChangeRoomQuantity, rooms]);

  const decreaseHandlers = useMemo(() => {
    const handlers: Record<number, () => void> = {};
    rooms.forEach((room) => {
      handlers[room.id] = () => onChangeRoomQuantity(room.id, -1);
    });
    return handlers;
  }, [onChangeRoomQuantity, rooms]);

  const selectedRoomCount = useMemo(
    () => Object.values(roomSelection).reduce((sum, count) => sum + count, 0),
    [roomSelection],
  );

  const selectedGuestCapacity = useMemo(
    () =>
      rooms.reduce((sum, room) => {
        const count = roomSelection[room.id] ?? 0;
        return sum + room.maxGuests * count;
      }, 0),
    [roomSelection, rooms],
  );

  const roomGap = Math.max(0, roomTarget - selectedRoomCount);
  const capacityGap = Math.max(0, guestTarget - selectedGuestCapacity);

  const selectedTotalPrice = useMemo(() => {
    const nightFactor = Math.max(1, nightCount);
    return rooms.reduce((sum, room) => {
      const count = roomSelection[room.id] ?? 0;
      if (count <= 0) {
        return sum;
      }

      const perRoomTotal = room.totalPrice ?? room.basePrice * nightFactor;
      return sum + perRoomTotal * count;
    }, 0);
  }, [nightCount, roomSelection, rooms]);

  const canSubmitMixBooking =
    rooms.length > 0 &&
    selectedRoomCount > 0 &&
    roomGap === 0 &&
    capacityGap === 0 &&
    selectedTotalPrice > 0;

  const bookingSummaryText =
    selectedRoomCount > 0 ? `${selectedRoomCount}间 共` : `需选${roomTarget}间`;
  const bookingHintText =
    roomGap > 0
      ? `还差${roomGap}间`
      : capacityGap > 0
        ? `还差${capacityGap}人容量`
        : '已满足人数和间数';

  return {
    roomSelection,
    roomMaxById,
    increaseHandlers,
    decreaseHandlers,
    selectedRoomCount,
    roomGap,
    capacityGap,
    selectedTotalPrice,
    canSubmitMixBooking,
    bookingSummaryText,
    bookingHintText,
  };
}
