import {
  QueriesObserver,
  QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import { signalProxy } from './signal-proxy'
import { injectIsRestoring } from './inject-is-restoring'
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  ThrowOnError,
} from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'
import type { Signal } from '@angular/core'

// This defines the `CreateQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function always gets undefined passed
type QueryObserverOptionsForCreateQueries<
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
                      | SkipTokenForCreateQueries
                    select?: (data: any) => infer TData
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
 * The `queries` array accepted by `injectQueries`. Recursively unwraps each tuple element so every entry's
 * `queryFn`/`select`/`throwOnError` are inferred individually, up to 20 elements — past that, tuple
 * recursion falls back to a single homogeneous options type. An opaque array (e.g. `unknown[]`) is returned
 * as-is; a non-tuple array of a known element type is mapped to that element type instead, with no such
 * limit.
 *
 * @template T - The type of the `queries` array as written at the call site.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant to
 * be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
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
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogeneous type!
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
 * The result type returned by `injectQueries`, when no `combine` is provided. Mirrors {@link QueriesOptions}:
 * each tuple element's result type is inferred individually, up to 20 elements — past that, tuple recursion
 * falls back to a single homogeneous {@link CreateQueryResult} type. A non-tuple array is mapped per-element
 * instead, with no such limit — every entry keeps its individually inferred type regardless of array length.
 *
 * @template T - The type of the `queries` array, as inferred by {@link QueriesOptions}.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant to
 * be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
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

export interface InjectQueriesOptions<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
> {
  queries:
    | readonly [...QueriesOptions<T>]
    | readonly [
        ...{ [K in keyof T]: GetCreateQueryOptionsForCreateQueries<T[K]> },
      ]
  combine?: (result: QueriesResults<T>) => TCombinedResult
}

/**
 * Injects a signal to fetch a variable number of queries.
 *
 * The `queries` key accepts an array with query option objects mostly identical to `injectQuery`'s. Having
 * the same query key more than once in the array of query objects may cause some data to be shared between
 * queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
 * structure.
 *
 * The `combine` option can be used to combine the results of the queries into a single value. The result
 * will be structurally shared to be as referentially stable as possible.
 *
 * @remarks Unlike `injectQuery`, `injectQueries` cannot infer the `data` argument of an _inline_ `select`
 * from its sibling `queryFn`. Because `injectQueries` infers the type of the whole `queries` array at once,
 * the `select` parameter of a query object written inline cannot be contextually typed from that same
 * object's `queryFn`, so it falls back to `unknown` — a
 * [known TypeScript limitation](https://github.com/TanStack/query/issues/6556). Annotate the `select`
 * parameter explicitly, or define the query with {@link queryOptions}, which resolves its types in a single
 * object _before_ it reaches `injectQueries`, to work around this — see the example below.
 * @param optionsFn - A function returning the queries' options — an array of query option objects under
 * `queries`, and an optional `combine`. Similar to `computed` from Angular, this function runs in the
 * reactive context, so signals read inside it (e.g. to build the `queries` array) drive the queries.
 * @param injector - The `Injector` in which to create the queries. If this is not provided, the current
 * injection context will be used instead (via `inject`).
 * @returns A `Signal` with the combined result. Without `combine`, this is an array with all the query
 * results, in the same order as the input. When `combine` is provided, this is the value returned by
 * `combine` instead.
 *
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     <ul>
 *       @for (query of postQueries(); track $index) {
 *         @if (query.isPending()) {
 *           <li>Loading...</li>
 *         } @else if (query.isError()) {
 *           <li>Error: {{ query.error()?.message }}</li>
 *         } @else {
 *           <li>{{ query.data().title }}</li>
 *         }
 *       }
 *     </ul>
 *   `,
 * })
 * export class Posts {
 *   readonly ids = signal([1, 2, 3])
 *
 *   readonly postQueries = injectQueries(() => ({
 *     queries: this.ids().map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *       staleTime: Infinity,
 *     })),
 *   }))
 * }
 * ```
 *
 * @example
 * Combining results into a single value:
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     @if (combined().isPending) {
 *       Loading...
 *     } @else if (combined().isError) {
 *       Error loading posts
 *     } @else {
 *       <ul>
 *         @for (post of combined().data; track post?.id) {
 *           <li>{{ post?.title }}</li>
 *         }
 *       </ul>
 *     }
 *   `,
 * })
 * export class Posts {
 *   readonly ids = signal([1, 2, 3])
 *
 *   readonly combined = injectQueries(() => ({
 *     queries: this.ids().map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *     combine: (postQueries) => ({
 *       data: postQueries.map((query) => query.data),
 *       isPending: postQueries.some((query) => query.isPending),
 *       isError: postQueries.some((query) => query.isError),
 *     }),
 *   }))
 * }
 * ```
 *
 * @example
 * Typing `select` via {@link queryOptions}. Note that spreading a `queryOptions` result and overriding
 * `select` inline still falls back to `unknown` — wrap the spread in `queryOptions` again so the override is
 * resolved before it reaches `injectQueries`:
 * ```angular-ts
 * const postOptions = (id: number) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * @Component({
 *   selector: 'post-title',
 *   template: `<h1>{{ fixed()[0].data() }}</h1>`,
 * })
 * export class PostTitle {
 *   readonly id = signal(1)
 *
 *   readonly broken = injectQueries(() => ({
 *     queries: [
 *       {
 *         ...postOptions(this.id()),
 *         // ❌ `data` is `unknown` here
 *         select: (data) => data.title,
 *       },
 *     ],
 *   }))
 *
 *   readonly fixed = injectQueries(() => ({
 *     queries: [
 *       queryOptions({
 *         ...postOptions(this.id()),
 *         // ✅ `data` is `Post`
 *         select: (data) => data.title,
 *       }),
 *     ],
 *   }))
 * }
 * ```
 */
export function injectQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  optionsFn: () => InjectQueriesOptions<T, TCombinedResult>,
  injector?: Injector,
): Signal<TCombinedResult> {
  !injector && assertInInjectionContext(injectQueries)
  return runInInjectionContext(injector ?? inject(Injector), () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)
    const isRestoring = injectIsRestoring()

    /**
     * Signal that has the default options from query client applied
     * computed() is used so signals can be inserted into the options
     * making it reactive. Wrapping options in a function ensures embedded expressions
     * are preserved and can keep being applied after signal changes
     */
    const optionsSignal = computed(() => {
      return optionsFn()
    })

    const defaultedQueries = computed(() => {
      return optionsSignal().queries.map((opts) => {
        const defaultedOptions = queryClient.defaultQueryOptions(
          opts as QueryObserverOptions,
        )
        // Make sure the results are already in fetching state before subscribing or updating options
        defaultedOptions._optimisticResults = isRestoring()
          ? 'isRestoring'
          : 'optimistic'

        return defaultedOptions as QueryObserverOptions
      })
    })

    const observerSignal = (() => {
      let instance: QueriesObserver<TCombinedResult> | null = null

      return computed(() => {
        return (instance ||= new QueriesObserver<TCombinedResult>(
          queryClient,
          defaultedQueries(),
          optionsSignal() as QueriesObserverOptions<TCombinedResult>,
        ))
      })
    })()

    const optimisticResultSignal = computed(() =>
      observerSignal().getOptimisticResult(
        defaultedQueries(),
        (optionsSignal() as QueriesObserverOptions<TCombinedResult>).combine,
      ),
    )

    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    effect(() => {
      observerSignal().setQueries(
        defaultedQueries(),
        optionsSignal() as QueriesObserverOptions<TCombinedResult>,
      )
    })

    const optimisticCombinedResultSignal = computed(() => {
      const [_optimisticResult, getCombinedResult, trackResult] =
        optimisticResultSignal()
      return getCombinedResult(trackResult())
    })

    const resultFromSubscriberSignal = signal<TCombinedResult | null>(null)

    effect(() => {
      const observer = observerSignal()
      const [_optimisticResult, getCombinedResult] = optimisticResultSignal()

      untracked(() => {
        const unsubscribe = isRestoring()
          ? () => undefined
          : ngZone.runOutsideAngular(() =>
              observer.subscribe(
                notifyManager.batchCalls((state) => {
                  resultFromSubscriberSignal.set(getCombinedResult(state))
                }),
              ),
            )

        destroyRef.onDestroy(unsubscribe)
      })
    })

    const resultSignal = computed(() => {
      const subscriberResult = resultFromSubscriberSignal()
      const optimisticResult = optimisticCombinedResultSignal()
      return subscriberResult ?? optimisticResult
    })

    return computed(() => {
      const result = resultSignal()
      const { combine } = optionsSignal()

      return combine
        ? result
        : (result as QueriesResults<T>).map((query) =>
            signalProxy(signal(query)),
          )
    })
  }) as unknown as Signal<TCombinedResult>
}
