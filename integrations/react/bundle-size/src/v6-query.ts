import { infiniteQueryOptions, useInfiniteQuery } from '#adapter'
import type { BookPagesOptions } from './books.ts'

export {
  useSuspenseInfiniteQuery as useSuspenseBookPages,
  useSuspenseQuery as useSuspenseBookQuery,
} from '#adapter'

export function useBookPages(options: BookPagesOptions) {
  return useInfiniteQuery(infiniteQueryOptions(options))
}

export { isError, isPending, useBookQuery } from './v6-catalog.ts'
export const isFetching = (result: { isFetching: boolean }) => result.isFetching
