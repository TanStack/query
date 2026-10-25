import { useInfiniteQuery } from '@tanstack/react-query'
import { productsQueries } from './services/products/queries'

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
    ...productsQueries.search<TData>({ indexName, query, hitsPerPage }),
    select: (data) => data.pages.flatMap((page) => page.hits),
    staleTime,
    gcTime,
  })
}
