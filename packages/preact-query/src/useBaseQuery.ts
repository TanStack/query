import { noop, notifyManager } from '@tanstack/query-core'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { useIsRestoring } from './IsRestoringProvider'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import {
  getHasError,
  prepareErrorBoundaryOptions,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import { useSyncExternalStore } from './utils'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { suspenseQueryPolicy } from './suspense'
import type { DefaultedQueryOptions, UseBaseQueryOptions } from './types'

/**
 * Base implementation shared by `useQuery`, `useInfiniteQuery`, `useSuspenseQuery`, and
 * `useSuspenseInfiniteQuery`.
 * @param options - The options passed to the calling hook.
 * @param Observer - The observer class from query-core (`QueryObserver` or
 * `InfiniteQueryObserver`).
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest
 * context will be used.
 * @param suspense - Render policy used by the dedicated Suspense hooks.
 * @returns The query result, tracking which properties are read unless `notifyOnChangeProps` is
 * set.
 * @throws {Error} If `options` is not an object (outside production), or the query error when it should be
 * thrown to the nearest error boundary (see `throwOnError`). While suspending, it throws a promise instead.
 */
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
  suspense?: typeof suspenseQueryPolicy,
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
  const defaultedOptions: DefaultedQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > = client.defaultQueryOptions({ ...options })

  const query = client
    .getQueryCache()
    .get<TQueryFnData, TError, TQueryData, TQueryKey>(
      defaultedOptions.queryHash,
    )

  if (process.env.NODE_ENV !== 'production') {
    if (!defaultedOptions.queryFn) {
      console.error(
        `[${defaultedOptions.queryHash}]: No query function was provided or configured in the query defaults. More info here: https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function`,
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

  suspense?.prepare(defaultedOptions)
  prepareErrorBoundaryOptions(
    defaultedOptions,
    errorResetBoundary,
    query,
    !!suspense,
  )

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        client,
        defaultedOptions,
      ),
  )

  const reader = observer.createResultReader(defaultedOptions)

  suspense?.readQuery(
    defaultedOptions,
    reader,
    observer,
    client,
    errorResetBoundary,
  )

  useEffect(() => {
    reader.commit()
  }, [reader])

  const shouldSubscribe = !isRestoring && subscribed
  const result = useSyncExternalStore(
    useCallback(
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
    reader.getSnapshot,
  )

  // Handle error boundary
  if (
    getHasError({
      result,
      errorResetBoundary,
      throwOnError: defaultedOptions.throwOnError,
      query,
      suspense: !!suspense,
    })
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
