import {
  QueriesObserver,
  QueryObserver,
  noop,
  notifyManager,
} from '@tanstack/query-core'
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  ThrowOnError,
} from '@tanstack/query-core'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import { useIsRestoring } from './IsRestoringProvider'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import {
  ensureSuspenseTimers,
  fetchOptimistic,
  shouldSuspend,
} from './suspense'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import { useSyncExternalStore } from './utils'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function always gets undefined passed
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData' | 'subscribed'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetUseQueryOptionsForUseQueries<T> =
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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseQueryOptionsForUseQueries<
                    TQueryFnData,
                    unknown extends TError ? DefaultError : TError,
                    unknown extends TData ? TQueryFnData : TData,
                    TQueryKey
                  >
                : // Fallback
                  UseQueryOptionsForUseQueries

// A defined initialData setting should return a DefinedUseQueryResult rather than UseQueryResult
type GetDefinedOrUndefinedQueryResult<T, TData, TError = unknown> = T extends {
  initialData?: infer TInitialData
}
  ? unknown extends TInitialData
    ? UseQueryResult<TData, TError>
    : TInitialData extends TData
      ? DefinedUseQueryResult<TData, TError>
      : TInitialData extends () => infer TInitialDataResult
        ? unknown extends TInitialDataResult
          ? UseQueryResult<TData, TError>
          : TInitialDataResult extends TData
            ? DefinedUseQueryResult<TData, TError>
            : UseQueryResult<TData, TError>
        : UseQueryResult<TData, TError>
  : UseQueryResult<TData, TError>

type GetUseQueryResult<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
        : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
          T extends [any, infer TError, infer TData]
          ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
          : T extends [infer TQueryFnData, infer TError]
            ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData>
              : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? GetDefinedOrUndefinedQueryResult<
                    T,
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : // Fallback
                  UseQueryResult

/**
 * The `queries` array accepted by `useQueries`. Recursively unwraps each tuple element so every entry's
 * `queryFn`/`select`/`throwOnError` are inferred individually, up to 20 elements. An opaque array (e.g.
 * `unknown[]`) is returned as-is; a non-tuple array of a known element type, or a tuple past 20 elements, falls
 * back to a single homogeneous options type.
 *
 * @template T - The type of the `queries` array as written at the call site.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant
 * to be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseQueryOptionsForUseQueries<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesOptions<
            [...Tails],
            [...TResults, GetUseQueryOptionsForUseQueries<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogeneous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                UseQueryOptionsForUseQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                UseQueryOptionsForUseQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : // Fallback
              Array<UseQueryOptionsForUseQueries>

/**
 * The result type returned by `useQueries`, when no `combine` is provided. Mirrors {@link QueriesOptions}: each
 * tuple element's result type is inferred individually, up to 20 elements. A non-tuple array is mapped
 * per-element instead, still inferring each entry individually; only past 20 elements does this fall back to a
 * single homogeneous {@link UseQueryResult} type.
 *
 * @template T - The type of the `queries` array, as inferred by {@link QueriesOptions}.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant
 * to be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type QueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesResults<
            [...Tails],
            [...TResults, GetUseQueryResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetUseQueryResult<T[K]> }

/**
 * The `useQueries` hook can be used to fetch a variable number of queries.
 *
 * The `queries` key accepts an array with query option objects identical to `useQuery` (excluding the
 * `queryClient` option - because the `QueryClient` can be passed in on the top level).
 *
 * Having the same query key more than once in the array of query objects may cause some data to be shared
 * between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
 * structure.
 *
 * The `combine` option can be used to combine the results of the queries into a single value. The result will
 * be structurally shared to be as referentially stable as possible.
 *
 * @param queryClient - Use this to provide a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The combined result. Without `combine`, this is an array with all the query results, in the same
 * order as the input. When `combine` is provided, this is the value returned by `combine` instead.
 *
 * @example
 * ```tsx
 * import { useQueries } from '@tanstack/preact-query'
 *
 * function Posts({ ids }: { ids: Array<number> }) {
 *   const postQueries = useQueries({
 *     queries: ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *       staleTime: Infinity,
 *     })),
 *   })
 *
 *   return (
 *     <ul>
 *       {postQueries.map((query, index) => {
 *         if (query.isPending) return <li key={ids[index]}>Loading...</li>
 *         if (query.isError) return <li key={ids[index]}>Error: {query.error.message}</li>
 *         return <li key={ids[index]}>{query.data.title}</li>
 *       })}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * Combining results into a single value:
 * ```tsx
 * import { useQueries } from '@tanstack/preact-query'
 *
 * function Posts({ ids }: { ids: Array<number> }) {
 *   const { data, isPending, isError } = useQueries({
 *     queries: ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *     combine: (postQueries) => {
 *       return {
 *         data: postQueries.map((query) => query.data),
 *         isPending: postQueries.some((query) => query.isPending),
 *         isError: postQueries.some((query) => query.isError),
 *       }
 *     },
 *   })
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return 'Error loading posts'
 *
 *   return (
 *     <ul>
 *       {data.map((post) => (
 *         <li key={post?.id}>{post?.title}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    /**
     * An array with query option objects, mostly identical to `useQuery` — except that `queryClient` and
     * `subscribed` aren't accepted per-query (`subscribed` is a top-level option here instead), and
     * `placeholderData` accepts a {@link QueriesPlaceholderDataFunction}, which is called with `previousData`
     * and `previousQuery` always `undefined`, rather than `useQuery`'s placeholder function.
     */
    queries:
      | readonly [...QueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetUseQueryOptionsForUseQueries<T[K]> }]
    /**
     * Use this to combine the results of the queries into a single value. The result will be structurally
     * shared to be as referentially stable as possible.
     */
    combine?: (result: QueriesResults<T>) => TCombinedResult
    /**
     * Set this to `false` to unsubscribe this observer from updates to the query cache.
     *
     * @defaultValue true
     */
    subscribed?: boolean
  },
  queryClient?: QueryClient,
): TCombinedResult {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const subscribed = options.subscribed !== false

  const defaultedQueries = useMemo(
    () =>
      queries.map((opts) => {
        const defaultedOptions = client.defaultQueryOptions(
          opts as QueryObserverOptions,
        )

        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = isRestoring
          ? 'isRestoring'
          : subscribed
            ? 'optimistic'
            : undefined

        return defaultedOptions
      }),
    [queries, client, isRestoring, subscribed],
  )

  defaultedQueries.forEach((queryOptions) => {
    ensureSuspenseTimers(queryOptions)
    const query = client.getQueryCache().get(queryOptions.queryHash)
    ensurePreventErrorBoundaryRetry(queryOptions, errorResetBoundary, query)
  })

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = useState(
    () =>
      new QueriesObserver<TCombinedResult>(
        client,
        defaultedQueries,
        options as QueriesObserverOptions<TCombinedResult>,
      ),
  )

  // note: this must be called before useSyncExternalStore
  const [optimisticResult, getCombinedResult, trackResult] =
    observer.getOptimisticResult(
      defaultedQueries,
      (options as QueriesObserverOptions<TCombinedResult>).combine,
    )

  const shouldSubscribe = !isRestoring && subscribed
  useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        shouldSubscribe
          ? observer.subscribe(notifyManager.batchCalls(onStoreChange))
          : noop,
      [observer, shouldSubscribe],
    ),
    () => observer.getCurrentResult(),
  )

  useEffect(() => {
    observer.setQueries(
      defaultedQueries,
      options as QueriesObserverOptions<TCombinedResult>,
    )
  }, [defaultedQueries, options, observer])

  const shouldAtLeastOneSuspend = optimisticResult.some((result, index) =>
    shouldSuspend(defaultedQueries[index], result),
  )

  const suspensePromises = shouldAtLeastOneSuspend
    ? optimisticResult.flatMap((result, index) => {
        const opts = defaultedQueries[index]

        if (opts && shouldSuspend(opts, result)) {
          const queryObserver = new QueryObserver(client, opts)
          return fetchOptimistic(opts, queryObserver, errorResetBoundary)
        }
        return []
      })
    : []

  if (suspensePromises.length > 0) {
    throw Promise.all(suspensePromises)
  }
  const firstSingleResultWhichShouldThrow = optimisticResult.find(
    (result, index) => {
      const query = defaultedQueries[index]
      return (
        query &&
        getHasError({
          result,
          errorResetBoundary,
          throwOnError: query.throwOnError,
          query: client.getQueryCache().get(query.queryHash),
          suspense: query.suspense,
        })
      )
    },
  )

  if (firstSingleResultWhichShouldThrow) {
    throw firstSingleResultWhichShouldThrow.error
  }

  return getCombinedResult(trackResult())
}
