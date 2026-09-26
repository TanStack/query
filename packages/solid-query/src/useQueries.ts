import { QueriesObserver, noop, shouldThrowError } from '@tanstack/query-core'
import { createStore, unwrap } from 'solid-js/store'
import {
  batch,
  createComputed,
  createMemo,
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
   * Setting it has no effect: reading `data` of a query that has no data yet suspends the nearest `<Suspense>`
   * boundary until none of the queries are loading, whether or not this option is set.
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

/**
 * The `useQueries` primitive can be used to fetch a variable number of queries.
 *
 * The `queries` key accepts an array with query option objects mostly identical to `useQuery` — see
 * `placeholderData` below for the one difference. A custom `QueryClient` is supplied once, as `useQueries`'
 * own top-level second argument, rather than per query.
 *
 * Having the same query key more than once in the array of query objects may cause some data to be shared
 * between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
 * structure.
 *
 * The `combine` option can be used to combine the results of the queries into a single value, such as an
 * array or an object. The result will be structurally shared to be as referentially stable as possible.
 *
 * Inside a `<Suspense>` boundary, reading `data` of a query that has no data yet suspends until none of the
 * queries are loading, so the boundary waits for all of them. When `throwOnError` asks to throw, reading
 * `data` throws the error to the nearest `<ErrorBoundary>`. A value that `combine` returns other than an array
 * is returned as is and does not suspend.
 *
 * `placeholderData` is supported here too, but unlike `useQuery`, it doesn't receive information from
 * previously rendered queries, because the number of queries can differ between renders.
 * @param queriesOptions - An accessor returning the `queries` array to run, and an optional `combine`
 * function.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The combined result. Without `combine`, this is an array with all the query results, in the same
 * order as the input. When `combine` is provided, this is the value returned by `combine` instead.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { useQueries } from '@tanstack/solid-query'
 *
 * function Posts(props: { ids: Array<number> }) {
 *   const postQueries = useQueries(() => ({
 *     queries: props.ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *       staleTime: Infinity,
 *     })),
 *   }))
 *
 *   return (
 *     <ul>
 *       <For each={postQueries}>
 *         {(postQuery) => {
 *           if (postQuery.isPending) return <li>Loading...</li>
 *           if (postQuery.isError) return <li>Error: {postQuery.error.message}</li>
 *           return <li>{postQuery.data.title}</li>
 *         }}
 *       </For>
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * Combining results into a single value:
 * ```tsx
 * import { For, Match, Switch } from 'solid-js'
 * import { useQueries } from '@tanstack/solid-query'
 *
 * function Posts(props: { ids: Array<number> }) {
 *   const combinedPostsQuery = useQueries(() => ({
 *     queries: props.ids.map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *     combine: (postQueries) => {
 *       return {
 *         data: postQueries.map((postQuery) => postQuery.data),
 *         isPending: postQueries.some((postQuery) => postQuery.isPending),
 *         isError: postQueries.some((postQuery) => postQuery.isError),
 *       }
 *     },
 *   }))
 *
 *   return (
 *     <Switch
 *       fallback={
 *         <ul>
 *           <For each={combinedPostsQuery.data}>{(post) => <li>{post?.title}</li>}</For>
 *         </ul>
 *       }
 *     >
 *       <Match when={combinedPostsQuery.isPending}>Loading...</Match>
 *       <Match when={combinedPostsQuery.isError}>Error loading posts</Match>
 *     </Switch>
 *   )
 * }
 * ```
 */
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

  const getObserverOptions = () => {
    const combine = (
      queriesOptions() as QueriesObserverOptions<TCombinedResult>
    ).combine
    return combine ? { combine } : undefined
  }

  const observer = new QueriesObserver(
    client(),
    defaultedQueries(),
    getObserverOptions(),
  )

  const getOptimisticResult = () =>
    observer.getOptimisticResult(
      defaultedQueries(),
      getObserverOptions()?.combine,
    )

  const [initialResults, getInitialCombinedResult] = getOptimisticResult()

  // The raw results drive Suspense and error handling, while the store holds
  // what is returned (the combined result when `combine` is set). Both are
  // only ever updated together through `commit`
  let observerResults = initialResults
  const [state, setState] = createStore<TCombinedResult>(
    getInitialCombinedResult(),
  )

  const setStore = setState as (...args: Array<unknown>) => void

  const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) return false
    const prototype: unknown = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  }

  // Merges `next` into the store node `current` and drops the keys that `next`
  // no longer has (setting a store key to `undefined` deletes it)
  const toMerge = (current: unknown, next: Record<string, unknown>) => {
    if (!isPlainObject(current)) return next
    const merged = { ...next }
    for (const key of Object.keys(current)) {
      if (!(key in merged)) merged[key] = undefined
    }
    return merged
  }

  // Merges the next state into the existing store nodes instead of replacing
  // them, so a result read once (e.g. `const [query] = useQueries(...)`) keeps
  // tracking later updates. `combine` may return any object, not only an array
  // of results
  const commit = (
    results: Array<QueryObserverResult>,
    nextState: TCombinedResult,
  ) => {
    observerResults = results
    const current: unknown = unwrap(state)
    batch(() => {
      if (!Array.isArray(nextState) || !Array.isArray(current)) {
        setStore(
          isPlainObject(nextState) ? toMerge(current, nextState) : nextState,
        )
        return
      }
      nextState.forEach((item: unknown, index) => {
        setStore(
          index,
          isPlainObject(item) ? toMerge(current[index], item) : item,
        )
      })
      if (current.length > nextState.length) {
        setStore((items: Array<unknown>) => items.slice(0, nextState.length))
      }
    })
  }

  const needsSuspend = () =>
    observerResults.some((result) => result.isFetching && result.isLoading)

  const getThrowableError = () => {
    const queries = observer.getQueries()
    for (let index = 0; index < observerResults.length; index++) {
      const result = observerResults[index]!
      if (
        result.isError &&
        !result.isFetching &&
        shouldThrowError(defaultedQueries()[index]?.throwOnError, [
          result.error,
          queries[index]!,
        ])
      ) {
        return { error: result.error }
      }
    }
    return undefined
  }

  // A single resource used only as a Suspense signal: it stays pending while
  // any query is loading, and rejects with the first error that `throwOnError`
  // asks to throw, like `useBaseQuery`
  let resolver: {
    resolve: (value: true) => void
    reject: (reason: unknown) => void
  } | null = null

  const settle = () => {
    if (!resolver || needsSuspend()) return
    const { resolve, reject } = resolver
    resolver = null
    const throwable = getThrowableError()
    if (throwable) {
      reject(throwable.error)
    } else {
      resolve(true)
    }
  }

  const [queryResource, { refetch }] = createResource<true>(
    () =>
      new Promise((resolve, reject) => {
        resolver = { resolve, reject }
        settle()
      }),
    needsSuspend() ? {} : { initialValue: true },
  )

  let taskQueue: Array<() => void> = []
  const subscribeToObserver = () =>
    observer.subscribe((result) => {
      taskQueue.push(() => {
        commit(
          result,
          getObserverOptions()
            ? getOptimisticResult()[1](result)
            : (result as unknown as TCombinedResult),
        )
        if (resolver) {
          settle()
        } else if (needsSuspend() || getThrowableError()) {
          // Re-run the resource when a query falls back into a hard loading
          // state (e.g. after `resetQueries`) or has an error to throw
          refetch()
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
    // Resolve a pending resource on unmount so Suspense does not hang
    if (resolver) {
      resolver.resolve(true)
      resolver = null
    }
  })

  onMount(() => {
    observer.setQueries(defaultedQueries(), getObserverOptions())
  })

  createComputed(
    on(
      defaultedQueries,
      () => {
        observer.setQueries(defaultedQueries(), getObserverOptions())
        const [results, getCombinedResult] = getOptimisticResult()
        commit(results, getCombinedResult())
        if (needsSuspend()) {
          refetch()
        }
      },
      { defer: true },
    ),
  )

  const handler: ProxyHandler<QueryObserverResult> = {
    get(target, prop) {
      if (prop === 'data') {
        if (target.data !== undefined) {
          // Rethrow an error the resource rejected with, without subscribing
          // to its loading state
          const error: unknown = queryResource.error
          if (error !== undefined) throw error
          return target.data
        }
        // Reading the resource suspends while any query is loading
        queryResource()
        return target.data
      }
      return Reflect.get(target, prop)
    },
  }

  // Cache one proxy per store node so a result keeps its identity across reads
  const proxies = new WeakMap<object, QueryObserverResult>()

  // The returned array reads each query's `data` through `handler`. A result
  // that `combine` turns into anything but an array is returned as is
  if (!Array.isArray(state)) return state

  return new Proxy(state, {
    get(target, prop, receiver) {
      const value: unknown = Reflect.get(target, prop, receiver)
      // Only the items of the results array are objects (its methods are
      // functions and `length` is a number)
      if (typeof value !== 'object' || !value) {
        return value
      }
      let proxy = proxies.get(value)
      if (!proxy) {
        proxy = new Proxy(value as QueryObserverResult, handler)
        proxies.set(value, proxy)
      }
      return proxy
    },
  })
}
