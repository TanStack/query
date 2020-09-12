import React from 'react'

import { useRerenderer } from './utils'
import { getResolvedQueryConfig } from '../core/config'
import { QueryObserver } from '../core/queryObserver'
import { QueryResultBase, QueryKey, QueryConfig } from '../core/types'
import { useErrorResetBoundary } from './ReactQueryErrorResetBoundary'
import { useQueryCache } from './ReactQueryCacheProvider'
import { useContextConfig } from './ReactQueryConfigProvider'

export function useBaseQuery<TResult, TError>(
  queryKey: QueryKey,
  config?: QueryConfig<TResult, TError>
): QueryResultBase<TResult, TError> {
  const cache = useQueryCache()
  const rerender = useRerenderer()
  const contextConfig = useContextConfig()
  const errorResetBoundary = useErrorResetBoundary()

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

    if (
      result.isError &&
      !errorResetBoundary.isReset() &&
      query.state.throwInErrorBoundary
    ) {
      throw result.error
    }

    if (
      resolvedConfig.enabled &&
      resolvedConfig.suspense &&
      !result.isSuccess
    ) {
      errorResetBoundary.clearReset()
      const unsubscribe = observer.subscribe()
      throw observer.fetch().finally(unsubscribe)
    }
  }

  return result
}
