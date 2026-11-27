import {
  infiniteQueryOptions,
  queryOptions,
  suspenseQueryOptions,
  suspenseInfiniteQueryOptions,
  useQuery,
} from '#adapter'

export function useBookQuery(options) {
  return useQuery(queryOptions(options))
}

export function useSuspenseBookQuery(options) {
  return useQuery(suspenseQueryOptions(options))
}

export function useBookPages(options) {
  return useQuery(infiniteQueryOptions(options))
}

export function useSuspenseBookPages(options) {
  return useQuery(suspenseInfiniteQueryOptions(options))
}

export { isPending, isError, isFetching } from '#adapter'
