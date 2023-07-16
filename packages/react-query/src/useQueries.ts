'use client'
import * as React from 'react'

import { QueriesObserver, notifyManager } from '@tanstack/query-core'
import { useSyncExternalStore } from './useSyncExternalStore'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import {
  ensureStaleTime,
  fetchOptimistic,
  shouldSuspend,
  willFetch,
} from './suspense'
import type { QueryFunction, QueryKey } from '@tanstack/query-core'
import type { UseQueryOptions, UseQueryResult } from './types'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// - `context` is omitted as it is passed as a root-level option to `useQueries` instead.
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'context'>

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

type GetOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseQueryOptionsForUseQueries<unknown, TError, TData>
    : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
    T extends [infer TQueryFnData, infer TError, infer TData]
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
    : T extends [infer TQueryFnData, infer TError]
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseQueryOptionsForUseQueries<TQueryFnData>
    : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        select: (data: any) => infer TData
      }
    ? UseQueryOptionsForUseQueries<TQueryFnData, unknown, TData, TQueryKey>
    : T extends { queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> }
    ? UseQueryOptionsForUseQueries<
        TQueryFnData,
        unknown,
        TQueryFnData,
        TQueryKey
      >
    : // Fallback
      UseQueryOptionsForUseQueries

type GetResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? UseQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseQueryResult<TData, TError>
    : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
    T extends [any, infer TError, infer TData]
    ? UseQueryResult<TData, TError>
    : T extends [infer TQueryFnData, infer TError]
    ? UseQueryResult<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseQueryResult<TQueryFnData>
    : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<unknown, any>
        select: (data: any) => infer TData
      }
    ? UseQueryResult<TData>
    : T extends { queryFn?: QueryFunction<infer TQueryFnData, any> }
    ? UseQueryResult<TQueryFnData>
    : // Fallback
      UseQueryResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? UseQueryOptionsForUseQueries[]
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetOptions<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesOptions<[...Tail], [...Result, GetOptions<Head>], [...Depth, 1]>
  : unknown[] extends T
  ? T
  : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
  // use this to infer the param types in the case of Array.map() argument
  T extends UseQueryOptionsForUseQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      infer TQueryKey
    >[]
  ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey>[]
  : // Fallback
    UseQueryOptionsForUseQueries[]

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? UseQueryResult[]
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
  : T extends UseQueryOptionsForUseQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      any
    >[]
  ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
    UseQueryResult<unknown extends TData ? TQueryFnData : TData, TError>[]
  : // Fallback
    UseQueryResult[]

export function useQueries<T extends any[]>({
  queries,
  context,
}: {
  queries: readonly [...QueriesOptions<T>]
  context?: UseQueryOptions['context']
}): QueriesResults<T> {
  const queryClient = useQueryClient({ context })
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()

  const defaultedQueries = React.useMemo(
    () =>
      queries.map((options) => {
        const defaultedOptions = queryClient.defaultQueryOptions(options)

        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = isRestoring
          ? 'isRestoring'
          : 'optimistic'

        return defaultedOptions
      }),
    [queries, queryClient, isRestoring],
  )

  defaultedQueries.forEach((query) => {
    ensureStaleTime(query)
    ensurePreventErrorBoundaryRetry(query, errorResetBoundary)
  })

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = React.useState(
    () => new QueriesObserver(queryClient, defaultedQueries),
  )

  const optimisticResult = observer.getOptimisticResult(defaultedQueries)

  useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        isRestoring
          ? () => undefined
          : observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer, isRestoring],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, { listeners: false })
  }, [defaultedQueries, observer])

  const shouldAtLeastOneSuspend = optimisticResult.some((result, index) =>
    shouldSuspend(defaultedQueries[index], result, isRestoring),
  )

  const suspensePromises = shouldAtLeastOneSuspend
    ? optimisticResult.flatMap((result, index) => {
        const options = defaultedQueries[index]
        const queryObserver = observer.getObservers()[index]

        if (options && queryObserver) {
          if (shouldSuspend(options, result, isRestoring)) {
            return fetchOptimistic(options, queryObserver, errorResetBoundary)
          } else if (willFetch(result, isRestoring)) {
            void fetchOptimistic(options, queryObserver, errorResetBoundary)
          }
        }
        return []
      })
    : []

  if (suspensePromises.length > 0) {
    throw Promise.all(suspensePromises)
  }
  const observerQueries = observer.getQueries()
  const firstSingleResultWhichShouldThrow = optimisticResult.find(
    (result, index) =>
      getHasError({
        result,
        errorResetBoundary,
        useErrorBoundary: defaultedQueries[index]?.useErrorBoundary ?? false,
        query: observerQueries[index]!,
      }),
  )

  if (firstSingleResultWhichShouldThrow?.error) {
    throw firstSingleResultWhichShouldThrow.error
  }

  return optimisticResult as QueriesResults<T>
}
