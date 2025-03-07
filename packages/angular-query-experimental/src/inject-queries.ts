import {
  QueriesObserver,
  QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import {
  DestroyRef,
  NgZone,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectIsRestoring } from './inject-is-restoring'
import type { Injector, Signal } from '@angular/core'
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

// This defines the `CreateQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type QueryObserverOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? QueryObserverOptionsForCreateQueries<
                    TQueryFnData,
                    unknown extends TError ? DefaultError : TError,
                    unknown extends TData ? TQueryFnData : TData,
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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? QueryObserverResult<
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
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
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
 * @public
 */
export type QueriesResults<
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
        ? QueriesResults<
            [...Tail],
            [...TResult, GetResults<Head>],
            [...TDepth, 1]
          >
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

/**
 * @param root0
 * @param root0.queries
 * @param root0.combine
 * @param injector
 * @public
 */
export function injectQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    queries: Signal<[...QueriesOptions<T>]>
    combine?: (result: QueriesResults<T>) => TCombinedResult
  },
  injector?: Injector,
): Signal<TCombinedResult> {
  return assertInjector(injectQueries, injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)
    const isRestoring = injectIsRestoring(injector)

    const defaultedQueries = computed(() => {
      return queries().map((opts) => {
        const defaultedOptions = queryClient.defaultQueryOptions(opts)
        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = isRestoring()
          ? 'isRestoring'
          : 'optimistic'

        return defaultedOptions as QueryObserverOptions
      })
    })

    const observer = new QueriesObserver<TCombinedResult>(
      queryClient,
      defaultedQueries(),
      options as QueriesObserverOptions<TCombinedResult>,
    )

    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    effect(() => {
      observer.setQueries(
        defaultedQueries(),
        options as QueriesObserverOptions<TCombinedResult>,
        { listeners: false },
      )
    })

    const [, getCombinedResult] = observer.getOptimisticResult(
      defaultedQueries(),
      (options as QueriesObserverOptions<TCombinedResult>).combine,
    )

    const result = signal(getCombinedResult() as any)

    effect(() => {
      const unsubscribe = isRestoring()
        ? () => undefined
        : ngZone.runOutsideAngular(() =>
            observer.subscribe(notifyManager.batchCalls(result.set)),
          )
      destroyRef.onDestroy(unsubscribe)
    })

    return result
  })
}
