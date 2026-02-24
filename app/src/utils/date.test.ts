import {
  createDefaultDateRange,
  getNightCount,
  isDateRangeValid,
} from './date';

describe('date utils', () => {
  it('validates date range and computes night count', () => {
    expect(isDateRangeValid('2026-02-10', '2026-02-11')).toBe(true);
    expect(getNightCount('2026-02-10', '2026-02-11')).toBe(1);
  });

  it('rejects invalid range and returns 0 night', () => {
    expect(isDateRangeValid('2026-02-10', '2026-02-10')).toBe(false);
    expect(getNightCount('2026-02-10', '2026-02-10')).toBe(0);
  });

  it('computes nights across month boundary', () => {
    expect(getNightCount('2026-02-27', '2026-03-02')).toBe(3);
  });

  it('builds default range with next-day checkout', () => {
    const range = createDefaultDateRange();
    expect(range.checkIn < range.checkOut).toBe(true);
  });
});
