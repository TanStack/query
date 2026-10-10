import { skipToken, useInfiniteQuery } from '@tanstack/react-query'
import { search } from './algolia'

export type UseAlgoliaOptions = {
  indexName: string
  query: string
  hitsPerPage?: number
  staleTime?: number
  gcTime?: number
}

export default function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  gcTime,
}: UseAlgoliaOptions) {
  return useInfiniteQuery({
    queryKey: ['algolia', indexName, query, hitsPerPage],
    queryFn: query
      ? ({ pageParam }) =>
          search<TData>({ indexName, query, pageParam, hitsPerPage })
      : skipToken,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (data) => data.pages.flatMap((page) => page.hits),
    staleTime,
    gcTime,
  })
}
