import type {
  DataTag,
  DefaultError,
  InfiniteData,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from './types'

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

export type UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = OmitKeyof<
  CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'queryFn'
> & {
  queryFn?: Exclude<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken | undefined
  >
}

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
  TQueryKey,
  TPageParam
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
    | undefined
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
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
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
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
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
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
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
