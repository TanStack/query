import {
  infiniteQueryOptions,
  queryOptions,
  suspenseQueryOptions,
  suspenseInfiniteQueryOptions,
  useQuery,
} from '#adapter'
import type {
  UndefinedInitialDataOptions,
  UseSuspenseQueryOptions,
} from '#adapter'
import type {
  BookPage,
  BookPagesOptions,
  SuspenseBookPagesOptions,
} from './books.ts'

export function useBookQuery<TQueryData, TData = TQueryData>(
  options: UndefinedInitialDataOptions<TQueryData, Error, TData>,
) {
  return useQuery(queryOptions(options))
}

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

export { isPending, isError, isFetching } from '#adapter'
