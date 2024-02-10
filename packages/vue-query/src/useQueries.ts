import { QueriesObserver } from '@tanstack/query-core'
import {
  computed,
  getCurrentScope,
  onScopeDispose,
  readonly,
  shallowRef,
  watch,
} from 'vue-demi'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { ShallowRef } from 'vue-demi'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'
import type { UseQueryOptions } from './useQuery'
import type { QueryClient } from './queryClient'
import type { DeepUnwrapRef, DistributiveOmit, MaybeRefDeep } from './types'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<
  UseQueryOptions<TQueryFnData, TError, TData, unknown, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

type GetOptions<T> =
  // Part 1: if UseQueryOptions are already being sent through, then just return T
  T extends UseQueryOptions
    ? DeepUnwrapRef<T>
    : // Part 2: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
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
          : // Part 3: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
            T extends [infer TQueryFnData, infer TError, infer TData]
            ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
            : T extends [infer TQueryFnData, infer TError]
              ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
              : T extends [infer TQueryFnData]
                ? UseQueryOptionsForUseQueries<TQueryFnData>
                : // Part 4: responsible for inferring and enforcing type if no explicit parameter was provided
                  T extends {
                      queryFn?: QueryFunction<
                        infer TQueryFnData,
                        infer TQueryKey
                      >
                      select?: (data: any) => infer TData
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? UseQueryOptionsForUseQueries<
                      TQueryFnData,
                      TError,
                      TData,
                      TQueryKey
                    >
                  : T extends {
                        queryFn?: QueryFunction<
                          infer TQueryFnData,
                          infer TQueryKey
                        >
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

// A defined initialData setting should return a DefinedQueryObserverResult rather than QueryObserverResult
type GetDefinedOrUndefinedQueryResult<T, TData, TError = unknown> = T extends {
  initialData?: infer TInitialData
}
  ? unknown extends TInitialData
    ? QueryObserverResult<TData, TError>
    : TInitialData extends TData
      ? DefinedQueryObserverResult<TData, TError>
      : TInitialData extends () => infer TInitialDataResult
        ? unknown extends TInitialDataResult
          ? QueryObserverResult<TData, TError>
          : TInitialDataResult extends TData
            ? DefinedQueryObserverResult<TData, TError>
            : QueryObserverResult<TData, TError>
        : QueryObserverResult<TData, TError>
  : QueryObserverResult<TData, TError>

type GetResults<T> =
  // Part 1: if using UseQueryOptions then the types are already set
  T extends UseQueryOptions<
    infer TQueryFnData,
    infer TError,
    infer TData,
    any,
    any
  >
    ? GetDefinedOrUndefinedQueryResult<
        T,
        undefined extends TData ? TQueryFnData : TData,
        TError
      >
    : // Part 2: responsible for mapping explicit type parameter to function result, if object
      T extends { queryFnData: any; error?: infer TError; data: infer TData }
      ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
      : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
        ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
        : T extends { data: infer TData; error?: infer TError }
          ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
          : // Part 3: responsible for mapping explicit type parameter to function result, if tuple
            T extends [any, infer TError, infer TData]
            ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
            : T extends [infer TQueryFnData, infer TError]
              ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
              : T extends [infer TQueryFnData]
                ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData>
                : // Part 4: responsible for mapping inferred type to results, if no explicit parameter was provided
                  T extends {
                      queryFn?: QueryFunction<infer TQueryFnData, any>
                      select?: (data: any) => infer TData
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? GetDefinedOrUndefinedQueryResult<
                      T,
                      unknown extends TData ? TQueryFnData : TData,
                      unknown extends TError ? DefaultError : TError
                    >
                  : T extends {
                        queryFn?: QueryFunction<infer TQueryFnData, any>
                        throwOnError?: ThrowOnError<any, infer TError, any, any>
                      }
                    ? GetDefinedOrUndefinedQueryResult<
                        T,
                        TQueryFnData,
                        unknown extends TError ? DefaultError : TError
                      >
                    : // Fallback
                      QueryObserverResult

/**
 * UseQueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type UseQueriesOptions<
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
        ? UseQueriesOptions<
            [...Tail],
            [...TResult, GetOptions<Head>],
            [...TDepth, 1]
          >
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
 * UseQueriesResults reducer recursively maps type param to results
 */
export type UseQueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetResults<Head>]
      : T extends [infer Head, ...infer Tail]
        ? UseQueriesResults<
            [...Tail],
            [...TResult, GetResults<Head>],
            [...TDepth, 1]
          >
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
              QueryObserverResult<
                unknown extends TData ? TQueryFnData : TData,
                TError
              >
            >
          : // Fallback
            Array<QueryObserverResult>

type UseQueriesOptionsArg<T extends Array<any>> = readonly [
  ...UseQueriesOptions<T>,
]

export function useQueries<
  T extends Array<any>,
  TCombinedResult = UseQueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    queries: MaybeRefDeep<UseQueriesOptionsArg<T>>
    combine?: (result: UseQueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): Readonly<ShallowRef<TCombinedResult>> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const defaultedQueries = computed(() =>
    cloneDeepUnref(queries).map((queryOptions) => {
      if (typeof queryOptions.enabled === 'function') {
        queryOptions.enabled = queryOptions.enabled()
      }

      const defaulted = client.defaultQueryOptions(queryOptions)
      defaulted._optimisticResults = client.isRestoring.value
        ? 'isRestoring'
        : 'optimistic'

      return defaulted
    }),
  )

  const observer = new QueriesObserver<TCombinedResult>(
    client,
    defaultedQueries.value,
    options as QueriesObserverOptions<TCombinedResult>,
  )
  const [, getCombinedResult] = observer.getOptimisticResult(
    defaultedQueries.value,
    (options as QueriesObserverOptions<TCombinedResult>).combine,
  )
  const state = shallowRef(getCombinedResult())

  let unsubscribe = () => {
    // noop
  }

  watch(
    client.isRestoring,
    (isRestoring) => {
      if (!isRestoring) {
        unsubscribe()
        unsubscribe = observer.subscribe(() => {
          const [, getCombinedResultRestoring] = observer.getOptimisticResult(
            defaultedQueries.value,
            (options as QueriesObserverOptions<TCombinedResult>).combine,
          )
          state.value = getCombinedResultRestoring()
        })
        // Subscription would not fire for persisted results
        const [, getCombinedResultPersisted] = observer.getOptimisticResult(
          defaultedQueries.value,
          (options as QueriesObserverOptions<TCombinedResult>).combine,
        )
        state.value = getCombinedResultPersisted()
      }
    },
    { immediate: true },
  )

  watch(
    defaultedQueries,
    () => {
      observer.setQueries(
        defaultedQueries.value,
        options as QueriesObserverOptions<TCombinedResult>,
      )
      const [, getCombinedResultPersisted] = observer.getOptimisticResult(
        defaultedQueries.value,
        (options as QueriesObserverOptions<TCombinedResult>).combine,
      )
      state.value = getCombinedResultPersisted()
    },
    { flush: 'sync' },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return readonly(state) as Readonly<ShallowRef<TCombinedResult>>
}
