'use client'
import * as React from 'react'

import { QueriesObserver, notifyManager } from '@tanstack/query-core'
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
import type { UseQueryOptions, UseQueryResult } from './types'
import type {
  DefaultError,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  ThrowOnError,
} from '@tanstack/query-core'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function always gets undefined passed
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData' | 'suspense'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

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
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey>
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? UseQueryOptionsForUseQueries<
        TQueryFnData,
        TError,
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
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? UseQueryResult<TData, unknown extends TError ? DefaultError : TError>
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, any>
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? UseQueryResult<
        TQueryFnData,
        unknown extends TError ? DefaultError : TError
      >
    : // Fallback
      UseQueryResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
  T extends Array<any>,
  Result extends Array<any> = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetOptions<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesOptions<[...Tail], [...Result, GetOptions<Head>], [...Depth, 1]>
  : Array<unknown> extends T
  ? T
  : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
  // use this to infer the param types in the case of Array.map() argument
  T extends Array<
      UseQueryOptionsForUseQueries<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey
      >
    >
  ? Array<UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey>>
  : // Fallback
    Array<UseQueryOptionsForUseQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
  T extends Array<any>,
  Result extends Array<any> = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
  : T extends Array<
      UseQueryOptionsForUseQueries<
        infer TQueryFnData,
        infer TError,
        infer TData,
        any
      >
    >
  ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
    Array<
      UseQueryResult<
        unknown extends TData ? TQueryFnData : TData,
        unknown extends TError ? DefaultError : TError
      >
    >
  : // Fallback
    Array<UseQueryResult>

export function useQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    queries: readonly [...QueriesOptions<T>]
    combine?: (result: QueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()

  const defaultedQueries = React.useMemo(
    () =>
      queries.map((opts) => {
        const defaultedOptions = client.defaultQueryOptions(opts)

        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = isRestoring
          ? 'isRestoring'
          : 'optimistic'

        return defaultedOptions
      }),
    [queries, client, isRestoring],
  )

  defaultedQueries.forEach((query) => {
    ensureStaleTime(query)
    ensurePreventErrorBoundaryRetry(query, errorResetBoundary)
  })

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = React.useState(
    () =>
      new QueriesObserver<TCombinedResult>(
        client,
        defaultedQueries,
        options as QueriesObserverOptions<TCombinedResult>,
      ),
  )

  const [optimisticResult, getCombinedResult, trackResult] =
    observer.getOptimisticResult(defaultedQueries)

  React.useSyncExternalStore(
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
    observer.setQueries(
      defaultedQueries,
      options as QueriesObserverOptions<TCombinedResult>,
      {
        listeners: false,
      },
    )
  }, [defaultedQueries, options, observer])

  const shouldAtLeastOneSuspend = optimisticResult.some((result, index) =>
    shouldSuspend(defaultedQueries[index], result, isRestoring),
  )

  const suspensePromises = shouldAtLeastOneSuspend
    ? optimisticResult.flatMap((result, index) => {
        const opts = defaultedQueries[index]
        const queryObserver = observer.getObservers()[index]

        if (opts && queryObserver) {
          if (shouldSuspend(opts, result, isRestoring)) {
            return fetchOptimistic(opts, queryObserver, errorResetBoundary)
          } else if (willFetch(result, isRestoring)) {
            void fetchOptimistic(opts, queryObserver, errorResetBoundary)
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
        throwOnError: defaultedQueries[index]?.throwOnError ?? false,
        query: observerQueries[index]!,
      }),
  )

  if (firstSingleResultWhichShouldThrow?.error) {
    throw firstSingleResultWhichShouldThrow.error
  }

  return getCombinedResult(trackResult())
}
