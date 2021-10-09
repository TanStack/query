import React from 'react'
import { QueryFunction } from '../core/types'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

type GetOptions<T extends any> =
  // Map params from object {queryFnData: TQueryFnData, error: TError, data: TData}
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseQueryOptions<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryOptions<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseQueryOptions<unknown, TError, TData>
    : // Map params from tuple [TQueryFnData, TError, TData]
    T extends [infer TQueryFnData, infer TError, infer TData]
    ? UseQueryOptions<TQueryFnData, TError, TData>
    : T extends [infer TQueryFnData, infer TError]
    ? UseQueryOptions<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseQueryOptions<TQueryFnData>
    : // Otherwise try to infer raw argument types
    T extends {
        queryFn?: QueryFunction<infer X>
        select: (data: any) => infer Y
      }
    ? UseQueryOptions<X, unknown, Y>
    : T extends { queryFn?: QueryFunction<infer X> }
    ? UseQueryOptions<X>
    : // Fallback
      UseQueryOptions

type GetResults<T> =
  // Map explicit type-object to results
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? UseQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseQueryResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseQueryResult<TData, TError>
    : // Map explicit type-tuple to results
    T extends [any, infer TError, infer TData]
    ? UseQueryResult<TData, TError>
    : T extends [infer TQueryFnData, infer TError]
    ? UseQueryResult<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseQueryResult<TQueryFnData>
    : // Otherwise map inferred type to results
    T extends { queryFn?: QueryFunction<any>; select: (data: any) => infer Y }
    ? UseQueryResult<Y>
    : T extends { queryFn?: QueryFunction<infer X> }
    ? UseQueryResult<X>
    : // Fallback
      UseQueryResult

/**
 * In case of very large array literal, revert to UseQueryOptions[]/UseQueryResult[] to avoid TS depth-limit error
 * note: limit does not apply in case of Array.map() argument
 */
type MAXIMUM_DEPTH = 20

/**
 * Step 1: infer mapped function param-types
 */
type QueriesOptions<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = []
> = Depth['length'] extends MAXIMUM_DEPTH
  ? UseQueryOptions[]
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetOptions<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesOptions<[...Tail], [...Result, GetOptions<Head>], [...Depth, 1]>
  : T // fallback if inference fails: T is inferred as the literal param array

/**
 * Step 2: map inferred type T to mapped results
 */
type QueriesResults<
  T extends any[],
  Result extends any[] = [],
  Depth extends ReadonlyArray<number> = []
> = Depth['length'] extends MAXIMUM_DEPTH
  ? UseQueryResult[]
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...Result, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
  // handle Array.map() => in step 1, T was inferred as literal param array (fallback)
  // so if TData is the same for all array elements, we can type the result as such
  : T extends UseQueryOptions<infer TQueryFnData, infer TError, infer TData>[] ?
  UseQueryResult<unknown extends TData? TQueryFnData : TData, TError>[]
  : UseQueryResult[] // fallback if inference fails

export function useQueries<T extends any[]>(
  queries: readonly [...QueriesOptions<T>]
): QueriesResults<T> {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const queryClient = useQueryClient()

  const defaultedQueries = queries.map(options => {
    const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

    // Make sure the results are already in fetching state before subscribing or updating options
    defaultedOptions.optimisticResults = true

    return defaultedOptions
  })

  const [observer] = React.useState(
    () => new QueriesObserver(queryClient, defaultedQueries)
  )

  const result = observer.getOptimisticResult(defaultedQueries)

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = observer.subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          forceUpdate(x => x + 1)
        }
      })
    )

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [observer])

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, { listeners: false })
  }, [defaultedQueries, observer])

  return result as QueriesResults<T>
}
