import { infiniteQueryOptions, useInfiniteQuery } from '#adapter'

export {
  useQuery as useBookQuery,
  useSuspenseInfiniteQuery as useSuspenseBookPages,
  useSuspenseQuery as useSuspenseBookQuery,
} from '#adapter'

export function useBookPages(options) {
  return useInfiniteQuery(infiniteQueryOptions(options))
}
