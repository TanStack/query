import React from 'react'

import { useQueryCache } from './ReactQueryCacheProvider'
import { useRerenderer } from './utils'
import { QueryInstance } from '../core/queryInstance'
import { QueryConfig, QueryKey, QueryResultBase } from '../core/types'

export function useBaseQuery<TResult, TError>(
  queryKey: QueryKey,
  config: QueryConfig<TResult, TError> = {}
): QueryResultBase<TResult, TError> {
  // Make a rerender function
  const rerender = useRerenderer()

  // Get the query cache
  const queryCache = useQueryCache()

  // Build the query for use
  const query = queryCache.buildQuery<TResult, TError>(queryKey, config)
  const state = query.state

  // Create a query instance ref
  const instanceRef = React.useRef<QueryInstance<TResult, TError>>()

  // Subscribe to the query when the subscribe function changes
  React.useEffect(() => {
    const instance = query.subscribe(() => {
      rerender()
    })

    instanceRef.current = instance

    // Unsubscribe when things change
    return () => instance.unsubscribe()
  }, [query, rerender])

  // Always update the config
  React.useEffect(() => {
    instanceRef.current?.updateConfig(config)
  })

  const enabledBool = Boolean(config.enabled)

  // Run the instance when the query or enabled change
  React.useEffect(() => {
    if (enabledBool && query) {
      // Just for change detection
    }
    instanceRef.current?.run()
  }, [enabledBool, query])

  const clear = React.useMemo(() => query.clear.bind(query), [query])
  const refetch = React.useMemo(() => query.refetch.bind(query), [query])

  return {
    clear,
    error: state.error,
    failureCount: state.failureCount,
    isError: state.isError,
    isFetching: state.isFetching,
    isIdle: state.isIdle,
    isLoading: state.isLoading,
    isStale: state.isStale,
    isSuccess: state.isSuccess,
    query,
    refetch,
    status: state.status,
    updatedAt: state.updatedAt,
  }
}
