import { useInfiniteQuery } from '@tanstack/react-query'
import { search } from './algolia'

export type UseAlgoliaOptions = {
  indexName: string
  query: string
  hitsPerPage?: number
  staleTime?: number
  gcTime?: number
  enabled?: boolean
}

export default function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  gcTime,
  enabled,
}: UseAlgoliaOptions) {
  const queryInfo = useInfiniteQuery({
    queryKey: ['algolia', indexName, query, hitsPerPage],
    queryFn: ({ pageParam }) =>
      search<TData>({ indexName, query, pageParam, hitsPerPage }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime,
    gcTime,
    enabled,
  })

  const hits = queryInfo.data?.pages.map((page) => page.hits).flat()

  return { ...queryInfo, hits }
}
