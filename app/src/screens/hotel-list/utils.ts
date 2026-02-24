export function formatShortDate(date?: string) {
  if (!date) {
    return '--';
  }

  const current = new Date(`${date}T00:00:00`);
  if (Number.isNaN(current.getTime())) {
    return '--';
  }

  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

export function parsePositivePrice(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
