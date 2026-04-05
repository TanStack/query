'use client'
import * as React from 'react'

import { environmentManager, noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
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
  willFetch,
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
  ;(client.getDefaultOptions().queries as any)?._experimental_beforeQuery?.(
    defaultedOptions,
  )

  const query = client
    .getQueryCache()
    .get<
      TQueryFnData,
      TError,
      TQueryData,
      TQueryKey
    >(defaultedOptions.queryHash)

  if (process.env.NODE_ENV !== 'production') {
    if (!defaultedOptions.queryFn) {
      console.error(
        `[${defaultedOptions.queryHash}]: No queryFn was passed as an option, and no default queryFn was found. The queryFn parameter is only optional when using a default queryFn. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`,
      )
    }
  }

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  ensureSuspenseTimers(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query)
  useClearResetErrorBoundary(errorResetBoundary)

  // this needs to be invoked before creating the Observer because that can create a cache entry
  const isNewCacheEntry = !client
    .getQueryCache()
    .get(defaultedOptions.queryHash)

  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        client,
        defaultedOptions,
      ),
  )

  observer.setOptions(defaultedOptions, { isNewCacheEntry })

  const result = observer.getOptimisticResult(defaultedOptions)

  React.useEffect(() => {
    errorResetBoundary.clearReset()
  }, [errorResetBoundary])

  React.useEffect(() => {
    observer.subscribe(notifyManager.batchCalls(() => {}))
  }, [observer])

  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    return fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
  }

  if (
    willFetch(result, isRestoring) &&
    defaultedOptions._optimisticResults !== 'optimistic'
  ) {
    observer.fetchOptimistic(defaultedOptions)
  }

  return result
}
