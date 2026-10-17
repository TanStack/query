import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  OmitKeyof,
  QueryKey,
  QueryKeyWithDataTag,
} from './types'
import type { SkipToken } from './utils'

/**
 * Framework-agnostic options accepted by `infiniteQueryOptions`.
 */
export type CoreInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

type UnusedSkipTokenInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  CoreInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn'
> & {
  queryFn?: Exclude<
    CoreInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken | undefined
  >
}

type DefinedInitialDataInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  UnusedSkipTokenInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'initialData'
> & {
  initialData:
    | InfiniteData<TQueryFnData, TPageParam>
    | (() => InfiniteData<TQueryFnData, TPageParam>)
}

/**
 * Defines reusable infinite query options with type inference. Returns the original options unchanged.
 * @param options - The infinite query options to reuse.
 * @returns The original options with the query key tagged with cached pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
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
 * Defines reusable infinite query options with type inference. Returns the original options unchanged.
 * @param options - The infinite query options to reuse.
 * @returns The original options with the query key tagged with cached pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
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
  > & { initialData?: undefined },
): UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & { initialData?: undefined } & QueryKeyWithDataTag<
    TQueryKey,
    InfiniteData<TQueryFnData, TPageParam>,
    TError
  >

/**
 * Defines reusable infinite query options with type inference. Returns the original options unchanged.
 * @param options - The infinite query options to reuse.
 * @returns The original options with the query key tagged with cached pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
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
 * Defines reusable infinite query options with type inference. Returns the original options unchanged.
 * @param options - The infinite query options to reuse.
 * @returns The original options with the query key tagged with cached pages and page parameters.
 */
export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: CoreInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): CoreInfiniteQueryOptions<
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
