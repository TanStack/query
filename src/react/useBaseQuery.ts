import React from 'react'

import { useRerenderer } from './utils'
import { QueryObserver } from '../core/queryObserver'
import { QueryResultBase, QueryObserverConfig } from '../core/types'
import { useDefaultedQueryConfig } from './useDefaultedQueryConfig'

export function useBaseQuery<TResult, TError>(
  config: QueryObserverConfig<TResult, TError> = {}
): QueryResultBase<TResult, TError> {
  config = useDefaultedQueryConfig(config)

  // Make a rerender function
  const rerender = useRerenderer()

  // Create query observer
  const observerRef = React.useRef<QueryObserver<TResult, TError>>()
  const firstRender = !observerRef.current
  const observer = observerRef.current || new QueryObserver(config)
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
    observer.updateConfig(config)
  }

  const result = observer.getCurrentResult()

  // Handle suspense
  if (config.suspense || config.useErrorBoundary) {
    const query = observer.getCurrentQuery()

    if (result.isError && query.state.throwInErrorBoundary) {
      throw result.error
    }

    if (config.enabled && config.suspense && !result.isSuccess) {
      const unsubscribe = observer.subscribe()
      throw observer.fetch().finally(unsubscribe)
    }
  }

  return result
}
