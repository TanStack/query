import { infiniteQueryOptions, select, skipToken } from '@tanstack/react-query'
import { productsAPI } from './api'
import type { SearchOptions } from './types'

export const productsQueries = {
  all: () => ['products'] as const,
  search: <TData>({
    indexName,
    query,
    hitsPerPage,
  }: Omit<SearchOptions, 'pageParam'>) =>
    infiniteQueryOptions({
      queryKey: [
        ...productsQueries.all(),
        'search',
        indexName,
        query,
        hitsPerPage,
      ] as const,
      queryFn: query
        ? ({ pageParam }) =>
            productsAPI.searchProducts<TData>({
              indexName,
              query,
              pageParam,
              hitsPerPage,
            })
        : skipToken,
      select: [select, (data) => data.pages.flatMap((page) => page.hits)],
      staleTime: 30 * 1000,
      gcTime: 15 * 60 * 1000,
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1 < lastPage.nbPages ? lastPageParam + 1 : undefined,
    }),
}
