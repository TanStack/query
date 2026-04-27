import { QueriesObserver, noop, shouldThrowError } from '@tanstack/query-core'
import { createStore, unwrap } from 'solid-js/store'
import {
  batch,
  createComputed,
  createMemo,
  createRenderEffect,
  createResource,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import type { SolidQueryOptions, UseQueryResult } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData' | 'suspense'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
  /**
   * @deprecated The `suspense` option has been deprecated in v5 and will be removed in the next major version.
   * The `data` property on useQueries is a plain object and not a SolidJS Resource.
   * It will not suspend when the data is loading.
   * Setting `suspense` to `true` will be a no-op.
   */
  suspense?: boolean
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseQueryResult<
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : // Fallback
                  UseQueryResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
type QueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetOptions<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesOptions<
            [...Tail],
            [...TResult, GetOptions<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
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
 * QueriesResults reducer recursively maps type param to results
 */
type QueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetResults<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesResults<
            [...Tail],
            [...TResult, GetResults<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetResults<T[K]> }

export function useQueries<
  T extends Array<any>,
  TCombinedResult extends QueriesResults<T> = QueriesResults<T>,
>(
  queriesOptions: Accessor<{
    queries:
      | readonly [...QueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetOptions<T[K]> }]
    combine?: (result: QueriesResults<T>) => TCombinedResult
  }>,
  queryClient?: Accessor<QueryClient>,
): TCombinedResult {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()

  const defaultedQueries = createMemo(() =>
    queriesOptions().queries.map((options) =>
      mergeProps(
        client().defaultQueryOptions(options as QueryObserverOptions),
        {
          get _optimisticResults() {
            return isRestoring() ? 'isRestoring' : 'optimistic'
          },
        },
      ),
    ),
  )

  const observer = new QueriesObserver(
    client(),
    defaultedQueries(),
    queriesOptions().combine
      ? ({
          combine: queriesOptions().combine,
        } as QueriesObserverOptions<TCombinedResult>)
      : undefined,
  )

  const [state, setState] = createStore<TCombinedResult>(
    observer.getOptimisticResult(
      defaultedQueries(),
      (queriesOptions() as QueriesObserverOptions<TCombinedResult>).combine,
    )[1](),
  )

  createRenderEffect(
    on(
      () => queriesOptions().queries.length,
      () => {
        const optimisticResult = observer.getOptimisticResult(
          defaultedQueries(),
          (queriesOptions() as QueriesObserverOptions<TCombinedResult>).combine,
        )
        // When queries are paused (e.g. offline), skip state update to
        // keep showing previous data instead of showing undefined.
        const hasPaused = optimisticResult[0].some(
          (r) => r.fetchStatus === 'paused',
        )
        if (!hasPaused) {
          setState(optimisticResult[1]())
        }
      },
    ),
  )

  let observerResults = observer.getOptimisticResult(
    defaultedQueries(),
    (queriesOptions() as QueriesObserverOptions<TCombinedResult>).combine,
  )[0]

  // Single resolver for the unified suspense resource.
  // Modeled after useBaseQuery: one resource, re-triggered via refetch().
  let resolver: {
    resolve: (value: any) => void
    reject: (reason: any) => void
  } | null = null

  const needsSuspend = () =>
    observerResults.some((r) => r.isFetching && r.isLoading)

  // Single resource created once. Re-triggered via refetch() on query changes.
  // Follows the same pattern as useBaseQuery's createResource.
  const [queryResource, { refetch }] = createResource<
    Array<QueryObserverResult> | undefined
  >(
    () => {
      return new Promise((resolve, reject) => {
        if (needsSuspend()) {
          resolver = { resolve, reject }
          return
        }
        // Check if any query has a throwable error
        for (let i = 0; i < observerResults.length; i++) {
          const result = observerResults[i]!
          if (
            result.isError &&
            !result.isFetching &&
            shouldThrowError(defaultedQueries()[i]?.throwOnError, [
              result.error,
              observer.getQueries()[i]!,
            ])
          ) {
            resolver = null
            reject(result.error)
            return
          }
        }
        resolver = null
        resolve(observerResults)
      })
    },
    needsSuspend() ? {} : { initialValue: observerResults },
  )

  let taskQueue: Array<() => void> = []
  const subscribeToObserver = () =>
    observer.subscribe((result) => {
      const allFinished = result.every((r) => !(r.isFetching && r.isLoading))

      if (allFinished) {
        observerResults = [...result]
      }

      taskQueue.push(() => {
        if (allFinished) {
          // When queries are paused (e.g. offline), skip state update to
          // keep showing previous data instead of showing undefined.
          const hasPaused = result.some((r) => r.fetchStatus === 'paused')
          if (!hasPaused) {
            // Update with combine-aware result when all queries are done
            const optimisticResult = observer.getOptimisticResult(
              defaultedQueries(),
              (queriesOptions() as QueriesObserverOptions<TCombinedResult>)
                .combine,
            )
            setState(optimisticResult[1]())
          }
        } else {
          // Intermediate update for non-Suspense usage
          batch(() => {
            for (let index = 0; index < result.length; index++) {
              const queryResult = result[index]!
              const unwrappedResult = { ...unwrap(queryResult) }
              // @ts-expect-error typescript pedantry regarding the possible range of index
              setState(index, unwrap(unwrappedResult))
            }
          })
          return
        }

        // Resolve or reject the single suspense resource
        if (resolver) {
          // Check for throwable errors first
          for (let i = 0; i < result.length; i++) {
            const queryResult = result[i]!
            if (
              queryResult.isError &&
              shouldThrowError(defaultedQueries()[i]?.throwOnError, [
                queryResult.error,
                observer.getQueries()[i]!,
              ])
            ) {
              resolver.reject(queryResult.error)
              resolver = null
              return
            }
          }
          resolver.resolve(observerResults)
          resolver = null
        } else {
          // No resolver means resource was already resolved (e.g. cached data).
          // Schedule refetch to update the resource value, following
          // the same pattern as useBaseQuery's subscriber.
          queueMicrotask(() => refetch())
        }
      })

      queueMicrotask(() => {
        const taskToRun = taskQueue.pop()
        if (taskToRun) taskToRun()
        taskQueue = []
      })
    })

  let unsubscribe: () => void = noop
  createComputed<() => void>((cleanup) => {
    cleanup?.()
    unsubscribe = isRestoring() ? noop : subscribeToObserver()
    // cleanup needs to be scheduled after synchronous effects take place
    return () => queueMicrotask(unsubscribe)
  })
  onCleanup(() => {
    unsubscribe()
    // Resolve pending resource on unmount to prevent Suspense hanging
    if (resolver) {
      resolver.resolve(observerResults)
      resolver = null
    }
  })

  onMount(() => {
    observer.setQueries(
      defaultedQueries(),
      queriesOptions().combine
        ? ({
            combine: queriesOptions().combine,
          } as QueriesObserverOptions<TCombinedResult>)
        : undefined,
    )
  })

  createComputed(
    on(
      defaultedQueries,
      () => {
        observer.setQueries(
          defaultedQueries(),
          queriesOptions().combine
            ? ({
                combine: queriesOptions().combine,
              } as QueriesObserverOptions<TCombinedResult>)
            : undefined,
        )

        const optimisticResult = observer.getOptimisticResult(
          defaultedQueries(),
          (queriesOptions() as QueriesObserverOptions<TCombinedResult>).combine,
        )
        observerResults = optimisticResult[0]

        // When queries are paused (e.g. offline), skip state update to
        // keep showing previous data instead of showing undefined.
        const hasPaused = observerResults.some(
          (r) => r.fetchStatus === 'paused',
        )
        if (!hasPaused) {
          setState(optimisticResult[1]())
        }

        // Only refetch (re-trigger Suspense) if queries actually need to suspend.
        // This prevents unnecessary Suspense fallback when offline or when
        // queries don't need fetching.
        if (needsSuspend()) {
          refetch()
        }
      },
      { defer: true },
    ),
  )

  const handler = (index: number) => ({
    get(target: QueryObserverResult, prop: keyof QueryObserverResult): any {
      if (prop === 'data') {
        // If data exists in state, return it directly (no Suspense trigger)
        if (target.data !== undefined) {
          return target.data
        }
        // When query is paused (e.g. offline), don't suspend - return undefined
        // to keep showing previous content without triggering Suspense fallback
        if (observerResults[index]?.fetchStatus === 'paused') {
          return undefined
        }
        // Reading queryResource() triggers Suspense when pending
        queryResource()
        return undefined
      }
      return Reflect.get(target, prop)
    },
  })

  return new Proxy(state, {
    get(target, prop, receiver) {
      const index = typeof prop === 'string' ? Number(prop) : NaN
      if (!Number.isNaN(index) && index >= 0 && index < target.length) {
        return new Proxy(target[index]!, handler(index))
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}
