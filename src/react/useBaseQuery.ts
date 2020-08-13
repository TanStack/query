import React from 'react'

import { useRerenderer } from './utils'
import { QueryObserver } from '../core/queryObserver'
import { QueryResultBase, QueryObserverConfig } from '../core/types'

export function useBaseQuery<TResult, TError>(
  config: QueryObserverConfig<TResult, TError> = {}
): QueryResultBase<TResult, TError> {
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
        Promise.resolve().then(rerender)
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
    if (result.isError && result.query.state.throwInErrorBoundary) {
      throw result.error
    }

    if (config.enabled && config.suspense && !result.isSuccess) {
      throw observer.fetch().finally(() => {
        observer.unsubscribe(true)
      })
    }
  }

  return result
}
