import * as React from 'react'
import { QueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { search } from './algolia'

// Since the `cacheTime` property is string literal and not computed, the codemod should change it.
export type UseAlgoliaOptionsButWithStringLiterals = {
  'indexName': string
  'query': string
  'hitsPerPage'?: number
  'staleTime'?: number
  'cacheTime'?: number
  'enabled'?: boolean
}

// Since the `cacheTime` property is an identifier and not computed, the codemod should change it.
export type UseAlgoliaOptions = {
  indexName: string
  query: string
  hitsPerPage?: number
  staleTime?: number
  cacheTime?: number
  enabled?: boolean
}

// Since the `cacheTime` property is an identifier and not computed, and shorthand, the codemod should change it.
export function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  cacheTime,
  enabled,
}: UseAlgoliaOptions) {
  const queryInfo = useInfiniteQuery({
    queryKey: ['algolia', indexName, query, hitsPerPage],
    queryFn: ({ pageParam }) =>
      search<TData>({ indexName, query, pageParam, hitsPerPage }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime,
    cacheTime,
    enabled,
  })

  const hits = queryInfo.data?.pages.map((page) => page.hits).flat()

  return { ...queryInfo, hits }
}

// Since the `cacheTime` property is an identifier and not computed, the codemod should change it.
export const asIdentifierExample = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  })

// Since the `cacheTime` property is a string literal and not computed, the codemod should change it.
export const asStringLiteralExample = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        'cacheTime': 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  })

// Since the `cacheTime` property is computed, the codemod shouldn't touch this example.
export const asComputedExample = () => {
  const cacheTime = 'foo'

  return new QueryClient({
    defaultOptions: {
      queries: {
        [cacheTime]: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  })
}
