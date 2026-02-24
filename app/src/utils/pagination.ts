export type PaginationGuardInput = {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
  isError: boolean;
};

export function shouldLoadNextPage(input: PaginationGuardInput): boolean {
  if (!input.hasNextPage) {
    return false;
  }
  if (input.isFetchingNextPage) {
    return false;
  }
  if (input.isPending || input.isError) {
    return false;
  }
  return true;
}
