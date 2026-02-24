const DAY_MS = 24 * 60 * 60 * 1000;

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function addDays(base: string, days: number): string {
  const date = parseDate(base);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function createDefaultDateRange(): {
  checkIn: string;
  checkOut: string;
} {
  const today = new Date();
  const checkIn = formatDate(today);
  const checkOut = addDays(checkIn, 1);
  return { checkIn, checkOut };
}

export function isDateRangeValid(
  checkIn?: string,
  checkOut?: string,
): boolean {
  if (!checkIn || !checkOut) {
    return false;
  }

  const checkInDate = parseDate(checkIn);
  const checkOutDate = parseDate(checkOut);
  return checkOutDate.getTime() > checkInDate.getTime();
}

export function getNightCount(checkIn?: string, checkOut?: string): number {
  if (!isDateRangeValid(checkIn, checkOut)) {
    return 0;
  }

  const checkInDate = parseDate(checkIn!);
  const checkOutDate = parseDate(checkOut!);
  return Math.round((checkOutDate.getTime() - checkInDate.getTime()) / DAY_MS);
}

export function formatDisplayDate(dateString?: string): string {
  if (!dateString) {
    return '--';
  }

  const date = parseDate(dateString);
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${month}/${day}`;
}
