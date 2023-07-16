import { QueriesObserver, notifyManager } from '@tanstack/query-core'
import { createComputed, onCleanup } from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  DefaultError,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
} from '@tanstack/query-core'
import type { CreateQueryResult, SolidQueryOptions } from './types'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type CreateQueryOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
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
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? CreateQueryOptionsForCreateQueries<unknown, TError, TData>
    : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
    T extends [infer TQueryFnData, infer TError, infer TData]
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
    : T extends [infer TQueryFnData, infer TError]
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? CreateQueryOptionsForCreateQueries<TQueryFnData>
    : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        select: (data: any) => infer TData
      }
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, Error, TData, TQueryKey>
    : T extends { queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> }
    ? CreateQueryOptionsForCreateQueries<
        TQueryFnData,
        Error,
        TQueryFnData,
        TQueryKey
      >
    : // Fallback
      CreateQueryOptionsForCreateQueries

type GetResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? CreateQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? CreateQueryResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? CreateQueryResult<TData, TError>
    : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
    T extends [any, infer TError, infer TData]
    ? CreateQueryResult<TData, TError>
    : T extends [infer TQueryFnData, infer TError]
    ? CreateQueryResult<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? CreateQueryResult<TQueryFnData>
    : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<unknown, any>
        select: (data: any) => infer TData
      }
    ? CreateQueryResult<TData>
    : T extends { queryFn?: QueryFunction<infer TQueryFnData, any> }
    ? CreateQueryResult<TQueryFnData>
    : // Fallback
      CreateQueryResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? CreateQueryOptionsForCreateQueries[]
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
  T extends CreateQueryOptionsForCreateQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      infer TQueryKey
    >[]
  ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[]
  : // Fallback
    CreateQueryOptionsForCreateQueries[]

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
  ? CreateQueryResult[]
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
  : T extends CreateQueryOptionsForCreateQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      any
    >[]
  ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
    CreateQueryResult<
      unknown extends TData ? TQueryFnData : TData,
      unknown extends TError ? DefaultError : TError
    >[]
  : // Fallback
    CreateQueryResult[]

export function createQueries<
  T extends any[],
  TCombinedResult = QueriesResults<T>,
>(
  queriesOptions: Accessor<{
    queries: readonly [...QueriesOptions<T>]
    combine?: (result: QueriesResults<T>) => TCombinedResult
  }>,
  queryClient?: Accessor<QueryClient>,
): TCombinedResult {
  const client = useQueryClient(queryClient?.())

  const defaultedQueries = queriesOptions().queries.map((options) => {
    const defaultedOptions = client.defaultQueryOptions(options)
    defaultedOptions._optimisticResults = 'optimistic'
    return defaultedOptions
  })

  const observer = new QueriesObserver(
    client,
    defaultedQueries,
    queriesOptions().combine
      ? ({
          combine: queriesOptions().combine,
        } as QueriesObserverOptions<TCombinedResult>)
      : undefined,
  )

  // @ts-expect-error - Types issue with solid-js createStore
  const [state, setState] = createStore<TCombinedResult>(
    observer.getOptimisticResult(defaultedQueries)[1](),
  )

  const unsubscribe = observer.subscribe((result) => {
    notifyManager.batchCalls(() => {
      setState(unwrap(result) as unknown as TCombinedResult)
    })()
  })

  onCleanup(unsubscribe)

  createComputed(() => {
    const updatedQueries = queriesOptions().queries.map((options) => {
      const defaultedOptions = client.defaultQueryOptions(options)
      defaultedOptions._optimisticResults = 'optimistic'
      return defaultedOptions
    })
    observer.setQueries(
      updatedQueries,
      queriesOptions().combine
        ? ({
            combine: queriesOptions().combine,
          } as QueriesObserverOptions<TCombinedResult>)
        : undefined,
      { listeners: false },
    )
  })

  return state
}
