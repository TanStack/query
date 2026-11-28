import type {
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryFunction,
  QueryKey,
  QueryKeyWithDataTag,
  QueryObserverOptions,
} from './types'
import type { DefaultQueryFn, SkipToken } from './utils'

/**
 * Observer options that the core helpers leave out: options whose behavior depends on the framework
 * adapter, and internal options.
 * @internal
 */
export type AdapterQueryObserverOptionKeys =
  | 'throwOnError'
  | 'suspense'
  | 'notifyOnChangeProps'
  | 'behavior'
  | '_defaulted'
  | '_type'
  | '_optimisticResults'

/**
 * The {@link QueryObserverOptions} that every framework adapter supports. Options that depend on a
 * framework, such as `throwOnError`, `suspense`, and `notifyOnChangeProps`, are left out. Use the
 * `queryOptions` helper of your adapter when you need them.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type CoreQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  AdapterQueryObserverOptionKeys
>

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is omitted, may be
 * `undefined`, or is a function that may return `undefined`. `data` may be `undefined` while the query is
 * `pending`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

/**
 * The options accepted by the `queryOptions` overload selected when `queryFn` is not `skipToken` and
 * `initialData` is omitted, may be `undefined`, or is a function that may return `undefined`. Same as
 * {@link UndefinedInitialDataOptions}, but `queryFn` may not be `skipToken`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UnusedSkipTokenOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  queryFn: Exclude<
    CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is known to be defined.
 * `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn: QueryFunction<TQueryFnData, TQueryKey> | DefaultQueryFn
}

/**
 * Defines query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.query`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreQueryOptions} are accepted. Use the `queryOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 *
 * This overload is selected when `initialData` is known to be defined, so the resulting `data` is never
 * `undefined` (unless a `select` changes `TData` to include `undefined`).
 * @param options - The {@link DefinedInitialDataOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * Defines query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.query`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreQueryOptions} are accepted. Use the `queryOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 * @param options - The {@link UnusedSkipTokenOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * Defines query options that can be shared between framework adapters and imperative APIs such as
 * `queryClient.query`. At runtime, it returns the options unchanged.
 *
 * Only {@link CoreQueryOptions} are accepted. Use the `queryOptions` helper of your adapter for
 * framework-specific options such as `throwOnError`.
 * @param options - The {@link UndefinedInitialDataOptions} to use.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 * @remarks This is the only overload that accepts `queryFn: skipToken`.
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export function queryOptions(options: unknown) {
  return options
}
