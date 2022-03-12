import { useInfiniteQuery } from 'react-query'
import { search } from './algolia'

export type UseAlgoliaOptions = {
  indexName: string
  query: string
  hitsPerPage?: number
  staleTime?: number
  cacheTime?: number
}

export default function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  cacheTime,
}: UseAlgoliaOptions) {
  const queryInfo = useInfiniteQuery(
    ['algolia', indexName, query],
    ({ pageParam }) =>
      search<TData>({ indexName, query, pageParam, hitsPerPage }),
    {
      getNextPageParam: lastPage => lastPage?.nextPage,
      staleTime,
      cacheTime,
    }
  )

  const hits = queryInfo.data?.pages.map(page => page.hits).flat()

  return { ...queryInfo, hits }
}
