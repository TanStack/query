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
import { useQueryClientResolver } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import type { QueryOptions, UseQueryResult } from './types'
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
  QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
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
  TCombinedResult extends object = QueriesResults<T>,
>(
  queriesOptions: Accessor<{
    queries:
      | readonly [...QueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetOptions<T[K]> }]
    combine?: (result: QueriesResults<T>) => TCombinedResult
  }>,
  queryClient?: Accessor<QueryClient>,
): TCombinedResult {
  const resolveClient = useQueryClientResolver(queryClient)
  const client = createMemo(() => resolveClient())
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

  // The store always holds the raw, uncombined results, because the resources
  // and proxies below are keyed by query index. `combine` is applied on top of
  // it right before the result is handed to the caller, so the combined result
  // of the observer is not needed here.
  const optimisticResult = () =>
    observer.getOptimisticResult(defaultedQueries(), undefined)[0]

  const [state, setState] =
    createStore<Array<QueryObserverResult>>(optimisticResult())

  createRenderEffect(
    on(
      () => queriesOptions().queries.length,
      () => setState(optimisticResult()),
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
      queriesOptions().combine
        ? ({
            combine: queriesOptions().combine,
          } as QueriesObserverOptions<TCombinedResult>)
        : undefined,
    )
  })

  createComputed(() => {
    observer.setQueries(
      defaultedQueries(),
      queriesOptions().combine
        ? ({
            combine: queriesOptions().combine,
          } as QueriesObserverOptions<TCombinedResult>)
        : undefined,
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

  // Whether `combine` is used has to be decided once, because a component
  // cannot hand out a different value later on. Removing it after the fact is
  // still handled by the memo below, which falls back to the results array.
  if (!queriesOptions().combine) {
    return proxyState as unknown as TCombinedResult
  }

  // `combine` may return any shape, so the combined result cannot live in a
  // store. It is derived from the tracked results instead, and read through a
  // proxy so that consumers stay subscribed to the properties they access.
  const combinedResult = createMemo(() => {
    const combine = queriesOptions().combine
    return combine
      ? combine(proxyState as unknown as QueriesResults<T>)
      : (proxyState as unknown as TCombinedResult)
  })

  // A proxy target cannot be swapped later on, so its kind is taken from the
  // first combined result to keep `Array.isArray` and `JSON.stringify` in line
  // with what `combine` returns. Every read is forwarded to the memo, but the
  // properties the target owns itself - `length`, if it is an array - have to
  // keep being reported even when a later combined result no longer has them,
  // because they are non-configurable.
  const target = (Array.isArray(combinedResult()) ? [] : {}) as TCombinedResult

  const getTargetDescriptor = (property: PropertyKey) =>
    Reflect.getOwnPropertyDescriptor(target, property)

  return new Proxy(target, {
    get: (_, property) => Reflect.get(combinedResult(), property),
    has: (_, property) =>
      Reflect.has(combinedResult(), property) ||
      getTargetDescriptor(property) !== undefined,
    ownKeys: () => [
      ...new Set([
        ...Reflect.ownKeys(combinedResult()),
        ...Reflect.ownKeys(target),
      ]),
    ],
    getOwnPropertyDescriptor: (_, property) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        combinedResult(),
        property,
      )
      const targetDescriptor = getTargetDescriptor(property)

      if (targetDescriptor) {
        // Report the target's own flags, or the proxy invariants are violated.
        return descriptor
          ? {
              ...targetDescriptor,
              value: Reflect.get(combinedResult(), property),
            }
          : targetDescriptor
      }

      // Properties the target does not own have to stay configurable, again to
      // satisfy the proxy invariants.
      return descriptor && { ...descriptor, configurable: true }
    },
  })
}
