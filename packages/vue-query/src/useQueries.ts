import { QueriesObserver } from '@tanstack/query-core'
import {
  computed,
  getCurrentScope,
  onScopeDispose,
  readonly,
  shallowRef,
  unref,
  watch,
} from 'vue-demi'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { Ref } from 'vue-demi'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  QueriesObserverOptions,
  QueryFunction,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'
import type { UseQueryOptions } from './useQuery'
import type { QueryClient } from './queryClient'
import type { DeepUnwrapRef, MaybeRefDeep } from './types'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetUseQueryOptionsForUseQueries<T> =
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
                  : T extends {
                        queryFn?:
                          | QueryFunction<infer TQueryFnData, infer TQueryKey>
                          | SkipTokenForUseQueries
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

type GetUseQueryResult<T> =
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
        unknown extends TError ? DefaultError : TError
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
                  : T extends {
                        queryFn?:
                          | QueryFunction<infer TQueryFnData, any>
                          | SkipTokenForUseQueries
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
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseQueryOptionsForUseQueries<Head>]
      : T extends [infer Head, ...infer Tails]
        ? UseQueriesOptions<
            [...Tails],
            [...TResults, GetUseQueryOptionsForUseQueries<Head>],
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
 * UseQueriesResults reducer recursively maps type param to results
 */
export type UseQueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? UseQueriesResults<
            [...Tails],
            [...TResults, GetUseQueryResult<Head>],
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
                unknown extends TError ? DefaultError : TError
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
): Readonly<Ref<TCombinedResult>> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const defaultedQueries = computed(() => {
    // Only unref the top level array.
    const queriesRaw = unref(queries) as ReadonlyArray<any>

    // Unref the rest for each element in the top level array.
    return queriesRaw.map((queryOptions) => {
      const clonedOptions = cloneDeepUnref(queryOptions)

      if (typeof clonedOptions.enabled === 'function') {
        clonedOptions.enabled = queryOptions.enabled()
      }

      const defaulted = client.defaultQueryOptions(clonedOptions)
      defaulted._optimisticResults = client.isRestoring.value
        ? 'isRestoring'
        : 'optimistic'

      return defaulted
    })
  })

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

  return readonly(state) as Readonly<Ref<TCombinedResult>>
}
