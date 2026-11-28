import type { AdapterQueryObserverOptionKeys } from './queryOptions'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
} from './types'
import type { SkipToken } from './utils'

/**
 * The {@link InfiniteQueryObserverOptions} that every framework adapter supports. Options that depend on a
 * framework, such as `throwOnError`, `suspense`, and `notifyOnChangeProps`, are left out. Use the
 * `infiniteQueryOptions` helper of your adapter when you need them.
 * @template TQueryFnData - The type your `queryFn` resolves to (a single page).
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the page parameter.
 */
export type CoreInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  AdapterQueryObserverOptionKeys
>

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is omitted, may be
 * `undefined`, or is a function that may return `undefined`.
 * @template TQueryFnData - The type your `queryFn` resolves to (a single page).
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the page parameter.
 */
export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CoreInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  initialData?:
    | undefined
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | InitialDataFunction<
        NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      >
}

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `queryFn` is not `skipToken`.
 * Same as {@link UndefinedInitialDataInfiniteOptions}, but `queryFn` may not be `skipToken`.
 * @template TQueryFnData - The type your `queryFn` resolves to (a single page).
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the page parameter.
 */
export type UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  CoreInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> & {
  queryFn: Exclude<
    CoreInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken
  >
}

/**
 * The options accepted by the `infiniteQueryOptions` overload selected when `initialData` is known to be
 * defined.
 * @template TQueryFnData - The type your `queryFn` resolves to (a single page).
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the page parameter.
 */
export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  CoreInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'initialData'
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
}

/**
 * Defines infinite query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.infiniteQuery`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreInfiniteQueryOptions} are accepted. Use the `infiniteQueryOptions` helper of your adapter
 * for framework-specific options such as `throwOnError`.
 *
 * This overload is selected when `initialData` is known to be defined.
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, TPageParam>, TError>

/**
 * Defines infinite query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.infiniteQuery`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreInfiniteQueryOptions} are accepted. Use the `infiniteQueryOptions` helper of your adapter
 * for framework-specific options such as `throwOnError`.
 * @param options - The {@link UnusedSkipTokenInfiniteOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UnusedSkipTokenInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, TPageParam>, TError>

/**
 * Defines infinite query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.infiniteQuery`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreInfiniteQueryOptions} are accepted. Use the `infiniteQueryOptions` helper of your adapter
 * for framework-specific options such as `throwOnError`.
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred pages and page parameters.
 * @remarks This is the only overload that accepts `queryFn: skipToken`.
 */
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, TPageParam>, TError>

export function infiniteQueryOptions(options: unknown) {
  return options
}
