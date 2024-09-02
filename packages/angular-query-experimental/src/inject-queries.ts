import { QueriesObserver, notifyManager } from '@tanstack/query-core'
import {
  DestroyRef,
  Injector,
  NgZone,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectQueryClient } from './inject-query-client'
import { lazySignalInitializer } from './util/lazy-signal-initializer/lazy-signal-initializer'
import type { CreateQueryOptions } from './types'
import type { Signal } from '@angular/core'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  OmitKeyof,
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
type CreateQueryOptionsForInjectQueries<
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
type SkipTokenForInjectQueries = symbol

type GetCreateQueryOptionsForInjectQueries<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
  ? CreateQueryOptionsForInjectQueries<TQueryFnData, TError, TData>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
  ? CreateQueryOptionsForInjectQueries<TQueryFnData, TError>
  : T extends { data: infer TData; error?: infer TError }
  ? CreateQueryOptionsForInjectQueries<unknown, TError, TData>
  : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
  T extends [infer TQueryFnData, infer TError, infer TData]
  ? CreateQueryOptionsForInjectQueries<TQueryFnData, TError, TData>
  : T extends [infer TQueryFnData, infer TError]
  ? CreateQueryOptionsForInjectQueries<TQueryFnData, TError>
  : T extends [infer TQueryFnData]
  ? CreateQueryOptionsForInjectQueries<TQueryFnData>
  : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
  T extends {
    queryFn?:
    | QueryFunction<infer TQueryFnData, infer TQueryKey>
    | SkipTokenForInjectQueries
    select?: (data: any) => infer TData
    throwOnError?: ThrowOnError<any, infer TError, any, any>
  }
  ? CreateQueryOptionsForInjectQueries<
    TQueryFnData,
    unknown extends TError ? DefaultError : TError,
    unknown extends TData ? TQueryFnData : TData,
    TQueryKey
  >
  : // Fallback
  CreateQueryOptionsForInjectQueries

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
    | SkipTokenForInjectQueries
    select?: (data: any) => infer TData
    throwOnError?: ThrowOnError<any, infer TError, any, any>
  }
  ? GetDefinedOrUndefinedQueryResult<
    T,
    unknown extends TData ? TQueryFnData : TData,
    unknown extends TError ? DefaultError : TError
  >
  : // Fallback
  QueryObserverResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 * @public
 */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueryOptionsForInjectQueries>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResults, GetCreateQueryOptionsForInjectQueries<Head>]
  : T extends [infer Head, ...infer Tails]
  ? QueriesOptions<
    [...Tails],
    [...TResults, GetCreateQueryOptionsForInjectQueries<Head>],
    [...TDepth, 1]
  >
  : ReadonlyArray<unknown> extends T
  ? T
  : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
  // use this to infer the param types in the case of Array.map() argument
  T extends Array<
    CreateQueryOptionsForInjectQueries<
      infer TQueryFnData,
      infer TError,
      infer TData,
      infer TQueryKey
    >
  >
  ? Array<
    CreateQueryOptionsForInjectQueries<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >
  >
  : // Fallback
  Array<CreateQueryOptionsForInjectQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 * @public
 */
export type QueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
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
  : T extends Array<
    CreateQueryOptionsForInjectQueries<
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

/**
 * @public
 */
export function injectQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  {
    queriesFn,
    ...options
  }: {
    queriesFn: (client: QueryClient) => readonly [...QueriesOptions<T>]
  } & QueriesObserverOptions<TCombinedResult>,
  injector?: Injector,
): Signal<TCombinedResult> {
  return assertInjector(injectQueries, injector, () => {
    const currentInjector = inject(Injector)
    const ngZone = currentInjector.get(NgZone)
    const destroyRef = currentInjector.get(DestroyRef)
    const queryClient = injectQueryClient({ injector })

    return lazySignalInitializer(() => {
      const defaultedQueriesOptionsSignal = computed(() => {
        const queriesOptions = runInInjectionContext(currentInjector, () =>
          queriesFn(queryClient),
        )

        return queriesOptions.map((opts) => {
          const defaultedOptions = queryClient.defaultQueryOptions(opts)
          // Make sure the results are already in fetching state before subscribing or updating options
          defaultedOptions._optimisticResults = 'optimistic'

          return defaultedOptions as QueryObserverOptions
        })
      })

      const observer = new QueriesObserver<TCombinedResult>(
        queryClient,
        defaultedQueriesOptionsSignal(),
        options,
      )

      const resultSignal = signal(
        observer.getOptimisticResult(
          defaultedQueriesOptionsSignal(),
          options.combine,
        )[1](),
      )

      effect(
        () => {
          const defaultedQueriesOptions = defaultedQueriesOptionsSignal()
          observer.setQueries(defaultedQueriesOptions, options, {
            // Do not notify on updates because of changes in the options because
            // these changes should already be reflected in the optimistic result.
            listeners: false,
          })

          untracked(() => {
            resultSignal.set(
              observer.getOptimisticResult(
                defaultedQueriesOptionsSignal(),
                options.combine,
              )[1](),
            )
          })
        },
        {
          injector: currentInjector,
        },
      )

      const unsubscribe = observer.subscribe(
        notifyManager.batchCalls((state) => {
          ngZone.run(() => {
            for (const result of state) {
              if (result.isError && !result.isFetching) {
                throw result.error
              }
            }

            resultSignal.set(
              observer.getOptimisticResult(
                defaultedQueriesOptionsSignal(),
                options.combine,
              )[1](),
            )
          })
        }),
      )
      destroyRef.onDestroy(unsubscribe)

      return resultSignal.asReadonly()
    })
  })
}
