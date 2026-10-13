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
import type { SkipToken } from './utils'

/**
 * Query options whose initial data may be undefined.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey
> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

/**
 * Query options whose query function cannot be skipToken.
 */
export type UnusedSkipTokenOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryFn'
> & {
  queryFn?: Exclude<
    QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >['queryFn'],
    SkipToken | undefined
  >
}

/**
 * Query options with defined initial data.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryFn'
> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
}

/**
 * Framework-agnostic options accepted by `queryOptions`.
 */
export type CoreQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  | UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  | UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>

/**
 * Defines reusable query options with type inference. Returns the original options unchanged.
 * @param options - The query options to reuse.
 * @returns The original options with inferred types.
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
 * Defines reusable query options and returns them unchanged.
 * @param options - The query options to reuse.
 * @returns The original options with inferred types.
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  },
): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> & {
    initialData?: undefined
  }

/**
 * Defines reusable query options and returns them unchanged.
 * @param options - The query options to reuse.
 * @returns The original options with inferred types.
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
 * Defines reusable query options and returns them unchanged.
 * @param options - The query options to reuse.
 * @returns The original options with inferred types.
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

/**
 * Defines reusable query options and returns them unchanged.
 * @param options - The query options to reuse.
 * @returns The original options with inferred types.
 */
export function queryOptions(options: unknown) {
  return options
}
