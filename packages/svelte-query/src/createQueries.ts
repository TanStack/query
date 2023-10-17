import { QueriesObserver, notifyManager } from '@tanstack/query-core'
import { derived, get, readable } from 'svelte/store'
import { useIsRestoring } from './useIsRestoring'
import { useQueryClient } from './useQueryClient'
import { isSvelteStore } from './utils'
import type { Readable } from 'svelte/store'
import type { StoreOrVal } from './types'
import type {
  DefaultError,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'

// This defines the `CreateQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type QueryObserverOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'placeholderData'
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
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? QueryObserverOptionsForCreateQueries<unknown, TError, TData>
    : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
    T extends [infer TQueryFnData, infer TError, infer TData]
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
    : T extends [infer TQueryFnData, infer TError]
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? QueryObserverOptionsForCreateQueries<TQueryFnData>
    : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        select: (data: any) => infer TData
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? QueryObserverOptionsForCreateQueries<
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? QueryObserverOptionsForCreateQueries<
        TQueryFnData,
        TError,
        TQueryFnData,
        TQueryKey
      >
    : // Fallback
      QueryObserverOptionsForCreateQueries

type GetResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? QueryObserverResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? QueryObserverResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? QueryObserverResult<TData, TError>
    : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
    T extends [any, infer TError, infer TData]
    ? QueryObserverResult<TData, TError>
    : T extends [infer TQueryFnData, infer TError]
    ? QueryObserverResult<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? QueryObserverResult<TQueryFnData>
    : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<unknown, any>
        select: (data: any) => infer TData
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? QueryObserverResult<TData, unknown extends TError ? DefaultError : TError>
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, any>
        throwOnError?: ThrowOnError<any, infer TError, any, any>
      }
    ? QueryObserverResult<
        TQueryFnData,
        unknown extends TError ? DefaultError : TError
      >
    : // Fallback
      QueryObserverResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
  T extends Array<any>,
  Result extends Array<any> = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
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
      QueryObserverOptionsForCreateQueries<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey
      >
    >
  ? Array<
      QueryObserverOptionsForCreateQueries<
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >
    >
  : // Fallback
    Array<QueryObserverOptionsForCreateQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
  T extends Array<any>,
  Result extends Array<any> = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
  : T extends Array<
      QueryObserverOptionsForCreateQueries<
        infer TQueryFnData,
        infer TError,
        infer TData,
        any
      >
    >
  ? // Dynamic-size (homogenous) CreateQueryOptions array: map directly to array of results
    Array<
      QueryObserverResult<
        unknown extends TData ? TQueryFnData : TData,
        unknown extends TError ? DefaultError : TError
      >
    >
  : // Fallback
    Array<QueryObserverResult>

export function createQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    queries: StoreOrVal<[...QueriesOptions<T>]>
    combine?: (result: QueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): Readable<TCombinedResult> {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  const queriesStore = isSvelteStore(queries) ? queries : readable(queries)

  const defaultedQueriesStore = derived(
    [queriesStore, isRestoring],
    ([$queries, $isRestoring]) => {
      return $queries.map((opts) => {
        const defaultedOptions = client.defaultQueryOptions(opts)
        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = $isRestoring
          ? 'isRestoring'
          : 'optimistic'
        return defaultedOptions
      })
    },
  )
  const observer = new QueriesObserver<TCombinedResult>(
    client,
    get(defaultedQueriesStore),
    options as QueriesObserverOptions<TCombinedResult>,
  )

  defaultedQueriesStore.subscribe(($defaultedQueries) => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(
      $defaultedQueries,
      options as QueriesObserverOptions<TCombinedResult>,
      { listeners: false },
    )
  })

  const [, getCombinedResult, trackResult] = observer.getOptimisticResult(
    get(defaultedQueriesStore),
  )

  const result = derived<
    typeof isRestoring,
    | Parameters<Parameters<typeof observer.subscribe>[0]>[0]
    | ReturnType<typeof getCombinedResult>
  >(
    isRestoring,
    ($isRestoring, set) => {
      const unsubscribe = $isRestoring
        ? () => undefined
        : observer.subscribe(notifyManager.batchCalls(set))

      return () => unsubscribe()
    },
    getCombinedResult(trackResult()),
  )

  const { subscribe } = derived(
    [result, defaultedQueriesStore],
    ([$result, $defaultedQueries]) => {
      $result = observer.getOptimisticResult($defaultedQueries)[0]
      const observers = observer.getObservers()
      return $defaultedQueries.map((query, index) =>
        query.notifyOnChangeProps
          ? // @ts-expect-error TCombinedResult should be an array
            $result[index]
          : // @ts-expect-error TCombinedResult should be an array
            observers[index]!.trackResult($result[index]),
      )
    },
  )
  // @ts-expect-error TCombinedResult should be an array
  return { subscribe }
}
