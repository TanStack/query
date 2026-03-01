'use client'
import * as React from 'react'

import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  DefaultError,
  Query,
  QueryCache,
  QueryClient,
  QueryFilters,
  QueryKey,
  QueryState,
} from '@tanstack/query-core'

type QueryStateOptions<TResult = QueryState> = {
  filters?: QueryFilters
  select?: (query: Query<unknown, DefaultError, unknown, QueryKey>) => TResult
}

function getResult<TResult = QueryState>(
  queryCache: QueryCache,
  options: QueryStateOptions<TResult>,
): Array<TResult> {
  return queryCache
    .findAll(options.filters)
    .map(
      (query): TResult =>
        (options.select ? options.select(query) : query.state) as TResult,
    )
}

export function useQueryState<TResult = QueryState>(
  options: QueryStateOptions<TResult> = {},
  queryClient?: QueryClient,
): Array<TResult> {
  const queryCache = useQueryClient(queryClient).getQueryCache()
  const optionsRef = React.useRef(options)
  const result = React.useRef<Array<TResult>>()
  if (!result.current) {
    result.current = getResult(queryCache, options)
  }

  React.useEffect(() => {
    optionsRef.current = options
  })

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => {
      const nextResult = replaceEqualDeep(
        result.current,
        getResult(queryCache, optionsRef.current),
      )
      if (result.current !== nextResult) {
        result.current = nextResult
      }

      return result.current
    },
    () => result.current,
  )!
}
