import type { NoSerialize } from '@builder.io/qwik'
import {
  noSerialize,
  useSignal,
  useStore,
  useVisibleTask$,
} from '@builder.io/qwik'
import type {
  DefaultError,
  QueriesPlaceholderDataFunction,
  QueryFunction,
} from '@tanstack/query-core'
import {
  QueriesObserver,
  QueryClient,
  notifyManager,
  type QueryKey,
} from '@tanstack/query-core'
import type { UseQueryOptions, UseQueryResult } from './types'
import { createQueryClient } from './useQueryClient'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
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
                ? UseQueryOptionsForUseQueries<
                    TQueryFnData,
                    Error,
                    TData,
                    TQueryKey
                  >
                : T extends {
                      queryFn?: QueryFunction<
                        infer TQueryFnData,
                        infer TQueryKey
                      >
                    }
                  ? UseQueryOptionsForUseQueries<
                      TQueryFnData,
                      Error,
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
        ? QueriesOptions<
            [...Tail],
            [...Result, GetOptions<Head>],
            [...Depth, 1]
          >
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
            ? UseQueryOptionsForUseQueries<
                TQueryFnData,
                TError,
                TData,
                TQueryKey
              >[]
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
        ? QueriesResults<
            [...Tail],
            [...Result, GetResults<Head>],
            [...Depth, 1]
          >
        : T extends UseQueryOptionsForUseQueries<
              infer TQueryFnData,
              infer TError,
              infer TData,
              any
            >[]
          ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
            UseQueryResult<
              unknown extends TData ? TQueryFnData : TData,
              unknown extends TError ? DefaultError : TError
            >[]
          : // Fallback
            UseQueryResult[]

export function useQueries<
  T extends any[],
  TCombinedResult = QueriesResults<T>,
>(queriesOptions: {
  queries: readonly [...QueriesOptions<T>]
  combine?: (result: QueriesResults<T>) => TCombinedResult
}) {
  const client = createQueryClient()

  const defaultedQueries = queriesOptions.queries.map((options) => {
    const defaultedOptions = client.defaultQueryOptions(options)
    defaultedOptions._optimisticResults = 'optimistic'
    return defaultedOptions
  })

  const _options: any = queriesOptions.combine
    ? { combine: queriesOptions.combine }
    : undefined
  const observer = new QueriesObserver(client, defaultedQueries, _options)
  const store = useStore<any>({
    result: observer.getOptimisticResult(defaultedQueries)[1](),
  })

  const observerSig = useSignal<NoSerialize<QueriesObserver>>()
  const combineSig = useSignal<any>(queriesOptions)

  useVisibleTask$(({ cleanup }) => {
    const { observer, unsubscribe } = createQueriesObserver(
      store,
      defaultedQueries,
      _options,
    )
    observerSig.value = observer
    store.options = defaultedQueries
    combineSig.value = observer?.getQueries

    cleanup(unsubscribe)
  })

  useVisibleTask$(({ track }) => {
    track(() => combineSig.value)
    if (observerSig.value) {
      const client = createQueryClient()
      const updatedQueries = combineSig.value.queries.map((options: any) => {
        const defaultedOptions = client.defaultQueryOptions(options)
        defaultedOptions._optimisticResults = 'optimistic'
        return defaultedOptions
      })
      const _options: any = combineSig.value.combine
        ? { combine: combineSig.value.combine }
        : undefined
      observerSig.value.setQueries(updatedQueries, _options, {
        listeners: false,
      })
    }
  })

  return store
}

const createQueriesObserver = (
  store: any,
  defaultedQueries: any,
  options: any,
) => {
  const client = new QueryClient()
  const observer = new QueriesObserver(client, defaultedQueries, options)

  const unsubscribe = observer.subscribe(
    notifyManager.batchCalls((result) => {
      store.result = result as unknown as any
    }),
  )

  return { observer: noSerialize(observer), unsubscribe }
}
