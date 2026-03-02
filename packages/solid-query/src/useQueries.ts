import { QueriesObserver, noop } from '@tanstack/query-core'
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
    /**
     * Set this to `false` to disable structural sharing between query results.
     * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
     * Only applies when `combine` is provided.
     * Defaults to `true`.
     */
    structuralSharing?:
      | boolean
      | ((oldData: unknown | undefined, newData: unknown) => unknown)
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
          structuralSharing: queriesOptions().structuralSharing,
        } as QueriesObserverOptions<TCombinedResult>)
      : undefined,
  )

  const [state, setState] = createStore<TCombinedResult>(
    observer.getOptimisticResult(
      defaultedQueries(),
      queriesOptions() as QueriesObserverOptions<TCombinedResult>,
    )[1](),
  )

  createRenderEffect(
    on(
      () => queriesOptions().queries.length,
      () =>
        setState(
          observer.getOptimisticResult(
            defaultedQueries(),
            queriesOptions() as QueriesObserverOptions<TCombinedResult>,
          )[1](),
        ),
    ),
  )

  const dataResources = createMemo(
    on(
      () => state.length,
      () =>
        state.map((queryRes) => {
          const dataPromise = () =>
            new Promise((resolve) => {
              if (queryRes.isFetching && queryRes.isLoading) return
              resolve(unwrap(queryRes.data))
            })
          return createResource(dataPromise)
        }),
    ),
  )

  batch(() => {
    const dataResources_ = dataResources()
    for (let index = 0; index < dataResources_.length; index++) {
      const dataResource = dataResources_[index]!
      dataResource[1].mutate(() => unwrap(state[index]!.data))
      dataResource[1].refetch()
    }
  })

  let taskQueue: Array<() => void> = []
  const subscribeToObserver = () =>
    observer.subscribe((result) => {
      taskQueue.push(() => {
        batch(() => {
          const dataResources_ = dataResources()
          for (let index = 0; index < dataResources_.length; index++) {
            const dataResource = dataResources_[index]!
            const unwrappedResult = { ...unwrap(result[index]) }
            // @ts-expect-error typescript pedantry regarding the possible range of index
            setState(index, unwrap(unwrappedResult))
            dataResource[1].mutate(() => unwrap(state[index]!.data))
            dataResource[1].refetch()
          }
        })
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
  onCleanup(unsubscribe)

  onMount(() => {
    observer.setQueries(
      defaultedQueries(),
      queriesOptions() as QueriesObserverOptions<TCombinedResult>,
    )
  })

  createComputed(() => {
    observer.setQueries(
      defaultedQueries(),
      queriesOptions() as QueriesObserverOptions<TCombinedResult>,
    )
  })

  const handler = (index: number) => ({
    get(target: QueryObserverResult, prop: keyof QueryObserverResult): any {
      if (prop === 'data') {
        return dataResources()[index]![0]()
      }
      return Reflect.get(target, prop)
    },
  })

  const getProxies = () =>
    state.map((s, index) => {
      return new Proxy(s, handler(index))
    })

  const [proxyState, setProxyState] = createStore(getProxies())
  createRenderEffect(() => setProxyState(getProxies()))

  return proxyState as TCombinedResult
}
