import React from 'react'

import { useRerenderer } from './utils'
import { getResolvedQueryConfig } from '../core/config'
import { QueryObserver } from '../core/queryObserver'
import { QueryResultBase, QueryConfig, QueryKey } from '../core/types'
import { useQueryCache } from './ReactQueryCacheProvider'
import { useContextConfig } from './ReactQueryConfigProvider'

export function useBaseQuery<TResult, TError>(
  queryKey: QueryKey,
  config?: QueryConfig<TResult, TError>
): QueryResultBase<TResult, TError> {
  const rerender = useRerenderer()
  const cache = useQueryCache()
  const contextConfig = useContextConfig()

  // Get resolved config
  const resolvedConfig = getResolvedQueryConfig(
    cache,
    queryKey,
    contextConfig,
    config
  )

  // Create query observer
  const observerRef = React.useRef<QueryObserver<TResult, TError>>()
  const firstRender = !observerRef.current
  const observer = observerRef.current || new QueryObserver(resolvedConfig)
  observerRef.current = observer

  // Subscribe to the observer
  React.useEffect(
    () =>
      observer.subscribe(() => {
        rerender()
      }),
    [observer, rerender]
  )

  // Update config
  if (!firstRender) {
    observer.updateConfig(resolvedConfig)
  }

  const result = observer.getCurrentResult()

  // Handle suspense
  if (resolvedConfig.suspense || resolvedConfig.useErrorBoundary) {
    const query = observer.getCurrentQuery()

    if (result.isError && query.state.throwInErrorBoundary) {
      throw result.error
    }

    if (
      resolvedConfig.enabled &&
      resolvedConfig.suspense &&
      !result.isSuccess
    ) {
      const unsubscribe = observer.subscribe()
      throw observer.fetch().finally(unsubscribe)
    }
  }

  return result
}
