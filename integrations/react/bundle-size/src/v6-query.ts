import { infiniteQueryOptions, useInfiniteQuery } from '#adapter'
import type { BookPagesOptions } from './books.ts'

export {
  useQuery as useBookQuery,
  useSuspenseInfiniteQuery as useSuspenseBookPages,
  useSuspenseQuery as useSuspenseBookQuery,
} from '#adapter'

export function useBookPages(options: BookPagesOptions) {
  return useInfiniteQuery(infiniteQueryOptions(options))
}

export const isPending = <T extends { isPending: boolean }>(
  result: T,
): result is T & { isPending: true } => result.isPending
export const isError = <T extends { isError: boolean }>(
  result: T,
): result is T & { isError: true } => result.isError
export const isFetching = (result: { isFetching: boolean }) => result.isFetching
