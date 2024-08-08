import type {
  DataTag,
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions, NonUndefinedGuard } from './types'

/**
 * @public
 */
export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
> & {
  initialData?: undefined
}

/**
 * @public
 */
export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
}

/**
 * Allows to share and re-use infinite query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 * @param options - The infinite query options to tag with the type from `queryFn`.
 * @returns The tagged infinite query options.
 * @public
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
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}

/**
 * Allows to share and re-use infinite query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 * @param options - The infinite query options to tag with the type from `queryFn`.
 * @returns The tagged infinite query options.
 * @public
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
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}

/**
 * Allows to share and re-use infinite query options in a type-safe way.
 *
 * The `queryKey` will be tagged with the type from `queryFn`.
 * @param options - The infinite query options to tag with the type from `queryFn`.
 * @returns The tagged infinite query options.
 * @public
 */
export function infiniteQueryOptions(options: unknown) {
  return options
}
