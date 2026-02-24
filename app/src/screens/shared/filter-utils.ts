export type GuestType = 'room' | 'adult' | 'child';

const GUEST_COUNT_LIMIT = 9;

export function selectDateRange(
  selectedDate: string,
  currentCheckIn?: string,
  currentCheckOut?: string,
): { checkIn: string; checkOut?: string } {
  if (!currentCheckIn || currentCheckOut || selectedDate <= currentCheckIn) {
    return {
      checkIn: selectedDate,
      checkOut: undefined,
    };
  }

  return {
    checkIn: currentCheckIn,
    checkOut: selectedDate,
  };
}

export function getNextGuestCount(
  type: GuestType,
  currentValue: number,
  delta: 1 | -1,
): number {
  if (type === 'child') {
    return Math.min(GUEST_COUNT_LIMIT, Math.max(0, currentValue + delta));
  }

  return Math.min(GUEST_COUNT_LIMIT, Math.max(1, currentValue + delta));
}

export function normalizeCityName(rawCity?: string | null): string {
  if (!rawCity) {
    return '';
  }

  return rawCity.replace(/(特别行政区|自治州|地区|盟|市)$/u, '').trim();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'unknown error';
}
