'use client'
import * as React from 'react'

import { noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { QueryServerSnapshotContext } from './HydrationBoundary'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import { useIsRestoring } from './IsRestoringProvider'
import {
  ensureSuspenseTimers,
  fetchOptimistic,
  shouldSuspend,
} from './suspense'
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

  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const client = useQueryClient(queryClient)
  const defaultedOptions = client.defaultQueryOptions(options)

  const query = client
    .getQueryCache()
    .get<TQueryFnData, TError, TQueryData, TQueryKey>(
      defaultedOptions.queryHash,
    )

  if (process.env.NODE_ENV !== 'production') {
    if (!defaultedOptions.queryFn) {
      console.error(
        `[${defaultedOptions.queryHash}]: No queryFn was passed as an option, and no default queryFn was found. The queryFn parameter is only optional when using a default queryFn. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`,
      )
    }
  }

  const subscribed = options.subscribed !== false

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : subscribed
      ? 'optimistic'
      : undefined

  ensureSuspenseTimers(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query)
  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        client,
        defaultedOptions,
      ),
  )

  // note: this must be called before useSyncExternalStore
  // The return value is intentionally discarded: the call's purpose is the side effect of priming
  // the observer's `#currentResult`, which `getSnapshot` (`observer.getCurrentResult()`) reads. The
  // rendered value comes from the `useSyncExternalStore` result below.
  observer.getOptimisticResult(defaultedOptions)

  // Result to replay while React is hydrating, matching what the server rendered. Built once on a
  // throwaway client so the live cache (which may already have advanced) is untouched. Computed in
  // a lazy initializer rather than a memo because `defaultedOptions` is intentionally mutated above.
  const snapshotClient = React.useContext(QueryServerSnapshotContext)
  const [serverSnapshotResult] = React.useState<
    QueryObserverResult<TData, TError> | undefined
  >(() => {
    if (!snapshotClient) {
      return undefined
    }

    const snapshotQuery = snapshotClient
      .getQueryCache()
      .get(defaultedOptions.queryHash)

    if (!snapshotQuery) {
      return undefined
    }

    const snapshotObserver = new Observer(snapshotClient, defaultedOptions)
    const snapshotResult =
      snapshotObserver.getOptimisticResult(defaultedOptions)
    snapshotObserver.destroy()

    return snapshotResult
  })

  const serverSnapshot = React.useCallback(
    () => serverSnapshotResult ?? observer.getCurrentResult(),
    [serverSnapshotResult, observer],
  )

  const shouldSubscribe = !isRestoring && subscribed
  const resultToRender = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = shouldSubscribe
          ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
          : noop

        // Update result to make sure we did not miss any query updates
        // between creating the observer and subscribing to it.
        observer.updateResult()

        return unsubscribe
      },
      [observer, shouldSubscribe],
    ),
    () => observer.getCurrentResult(),
    serverSnapshot,
  )

  React.useEffect(() => {
    observer.setOptions(defaultedOptions)
  }, [defaultedOptions, observer])

  // Handle suspense
  if (shouldSuspend(defaultedOptions, resultToRender)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
  }

  // Handle error boundary
  if (
    getHasError({
      result: resultToRender,
      errorResetBoundary,
      throwOnError: defaultedOptions.throwOnError,
      query,
      suspense: defaultedOptions.suspense,
    })
  ) {
    throw resultToRender.error
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(resultToRender)
    : resultToRender
}
