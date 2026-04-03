import type {
  DataTag,
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  NonUndefinedGuard,
  QueryKey,
} from '@tanstack/query-core'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
> & {
  initialData?: undefined
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
}

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
    TPageParam,
    undefined
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  undefined
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}
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
    TPageParam,
    InfiniteQueryMode
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  InfiniteQueryMode
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}

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
    TPageParam,
    undefined
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  undefined
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}

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
    TPageParam,
    InfiniteQueryMode
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  InfiniteQueryMode
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
}

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

export function infiniteQueryOptions(options: unknown) {
  return options
}
