import { infiniteQueryOptions, skipToken } from '@tanstack/svelte-query'
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
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1 < lastPage.nbPages ? lastPageParam + 1 : undefined,
    }),
}
