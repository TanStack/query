import {
  infiniteQueryOptions,
  suspenseQueryOptions,
  suspenseInfiniteQueryOptions,
  useQuery,
} from '#adapter'
import type { UseSuspenseQueryOptions } from '#adapter'
import type {
  BookPage,
  BookPagesOptions,
  SuspenseBookPagesOptions,
} from './books.ts'

export function useSuspenseBookQuery(
  options: UseSuspenseQueryOptions<BookPage>,
) {
  return useQuery(suspenseQueryOptions(options))
}

export function useBookPages(options: BookPagesOptions) {
  return useQuery(infiniteQueryOptions(options))
}

export function useSuspenseBookPages(options: SuspenseBookPagesOptions) {
  return useQuery(suspenseInfiniteQueryOptions(options))
}

export { isError, isPending, useBookQuery } from './treeshakable-book-list.ts'
export { isFetching } from '#adapter'
