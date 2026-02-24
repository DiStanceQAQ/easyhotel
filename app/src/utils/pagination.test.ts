import { shouldLoadNextPage } from './pagination';

describe('pagination guard', () => {
  it('returns true when all conditions satisfy', () => {
    expect(
      shouldLoadNextPage({
        hasNextPage: true,
        isFetchingNextPage: false,
        isPending: false,
        isError: false,
      }),
    ).toBe(true);
  });

  it('returns false when no next page', () => {
    expect(
      shouldLoadNextPage({
        hasNextPage: false,
        isFetchingNextPage: false,
        isPending: false,
        isError: false,
      }),
    ).toBe(false);
  });

  it('returns false while fetching', () => {
    expect(
      shouldLoadNextPage({
        hasNextPage: true,
        isFetchingNextPage: true,
        isPending: false,
        isError: false,
      }),
    ).toBe(false);
  });
});
