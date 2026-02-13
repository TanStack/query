import { QueriesObserver } from '@tanstack/query-core'
import { useIsRestoring } from './useIsRestoring.js'
import { createRawRef } from './containers.svelte.js'
import { useQueryClient } from './useQueryClient.js'
import type {
  Accessor,
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js'
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  ThrowOnError,
} from '@tanstack/query-core'

// This defines the `CreateQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function always gets undefined passed
type CreateQueryOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForCreateQueries = symbol

type GetCreateQueryOptionsForCreateQueries<T> =
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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForCreateQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? CreateQueryOptionsForCreateQueries<
                    TQueryFnData,
                    unknown extends TError ? DefaultError : TError,
                    unknown extends TData ? TQueryFnData : TData,
                    TQueryKey
                  >
                : // Fallback
                  CreateQueryOptionsForCreateQueries

// A defined initialData setting should return a DefinedCreateQueryResult rather than CreateQueryResult
type GetDefinedOrUndefinedQueryResult<T, TData, TError = unknown> = T extends {
  initialData?: infer TInitialData
}
  ? unknown extends TInitialData
    ? CreateQueryResult<TData, TError>
    : TInitialData extends TData
      ? DefinedCreateQueryResult<TData, TError>
      : TInitialData extends () => infer TInitialDataResult
        ? unknown extends TInitialDataResult
          ? CreateQueryResult<TData, TError>
          : TInitialDataResult extends TData
            ? DefinedCreateQueryResult<TData, TError>
            : CreateQueryResult<TData, TError>
        : CreateQueryResult<TData, TError>
  : CreateQueryResult<TData, TError>

type GetCreateQueryResult<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
        : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
          T extends [any, infer TError, infer TData]
          ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
          : T extends [infer TQueryFnData, infer TError]
            ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData>
              : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForCreateQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? GetDefinedOrUndefinedQueryResult<
                    T,
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : // Fallback
                  CreateQueryResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueryOptionsForCreateQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueryOptionsForCreateQueries<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesOptions<
            [...Tails],
            [...TResults, GetCreateQueryOptionsForCreateQueries<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                CreateQueryOptionsForCreateQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                CreateQueryOptionsForCreateQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : // Fallback
              Array<CreateQueryOptionsForCreateQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesResults<
            [...Tails],
            [...TResults, GetCreateQueryResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetCreateQueryResult<T[K]> }

export function createQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  createQueriesOptions: Accessor<{
    queries:
      | readonly [...QueriesOptions<T>]
      | readonly [
          ...{ [K in keyof T]: GetCreateQueryOptionsForCreateQueries<T[K]> },
        ]
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
  const client = $derived(useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()

  const { queries, ...derivedCreateQueriesOptions } =
    $derived.by(createQueriesOptions)
  const resolvedQueryOptions = $derived(
    queries.map((opts) => {
      const resolvedOptions = client.defaultQueryOptions(opts)
      // Make sure the results are already in fetching state before subscribing or updating options
      resolvedOptions._optimisticResults = isRestoring.current
        ? 'isRestoring'
        : 'optimistic'
      return resolvedOptions
    }),
  )

  // can't do same as createMutation, as QueriesObserver has no `setOptions` method
  const observer = $derived(
    new QueriesObserver<TCombinedResult>(
      client,
      resolvedQueryOptions,
      derivedCreateQueriesOptions as QueriesObserverOptions<TCombinedResult>,
    ),
  )

  function createResult() {
    const [_, getCombinedResult, trackResult] = observer.getOptimisticResult(
      resolvedQueryOptions,
      derivedCreateQueriesOptions.combine as QueriesObserverOptions<TCombinedResult>['combine'],
      derivedCreateQueriesOptions.structuralSharing,
    )
    return getCombinedResult(trackResult())
  }

  // @ts-expect-error - the crazy-complex TCombinedResult type doesn't like being called an array
  // svelte-ignore state_referenced_locally
  const [results, update] = createRawRef<TCombinedResult>(createResult())

  $effect(() => {
    const unsubscribe = isRestoring.current
      ? () => undefined
      : observer.subscribe(() => update(createResult()))
    return unsubscribe
  })

  $effect.pre(() => {
    observer.setQueries(
      resolvedQueryOptions,
      derivedCreateQueriesOptions as QueriesObserverOptions<TCombinedResult>,
    )
    update(createResult())
  })

  return results
}
