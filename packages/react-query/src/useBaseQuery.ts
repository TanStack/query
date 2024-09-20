'use client'
import * as React from 'react'

import { isServer, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import { useIsRestoring } from './isRestoring'
import {
  ensureSuspenseTimers,
  fetchOptimistic,
  shouldSuspend,
  willFetch,
} from './suspense'
import { noop } from './utils'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { UseBaseQueryOptions } from './types'

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): QueryObserverResult<TData, TError> {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object',
      )
    }
  }

  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = client.defaultQueryOptions(options)

  ;(client.getDefaultOptions().queries as any)?._experimental_beforeQuery?.(
    defaultedOptions,
  )

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  ensureSuspenseTimers(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  // this needs to be invoked before creating the Observer because that can create a cache entry
  const isNewCacheEntry = !client.getQueryState(options.queryKey)

  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        client,
        defaultedOptions,
      ),
  )

  const result = observer.getOptimisticResult(defaultedOptions)

  React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = isRestoring
          ? () => undefined
          : observer.subscribe(notifyManager.batchCalls(onStoreChange))

        // Update result to make sure we did not miss any query updates
        // between creating the observer and subscribing to it.
        observer.updateResult()

        return unsubscribe
      },
      [observer, isRestoring],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions, observer])

  // Handle suspense
  if (shouldSuspend(defaultedOptions, result)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
  }

  // Handle error boundary
  if (
    getHasError({
      result,
      errorResetBoundary,
      throwOnError: defaultedOptions.throwOnError,
      query: client
        .getQueryCache()
        .get<
          TQueryFnData,
          TError,
          TQueryData,
          TQueryKey
        >(defaultedOptions.queryHash),
    })
  ) {
    throw result.error
  }

  ;(client.getDefaultOptions().queries as any)?._experimental_afterQuery?.(
    defaultedOptions,
    result,
  )

  if (
    defaultedOptions.experimental_prefetchInRender &&
    !isServer &&
    willFetch(result, isRestoring)
  ) {
    const promise = isNewCacheEntry
      ? // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
        fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
      : // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
        client.getQueryCache().get(defaultedOptions.queryHash)?.promise

    promise?.catch(noop).finally(() => {
      if (!observer.hasListeners()) {
        // `.updateResult()` will trigger `.#currentThenable` to finalize
        observer.updateResult()
      }
    })
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
