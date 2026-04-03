import type {
  DataTag,
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  NonUndefinedGuard,
  QueryKey,
} from '@tanstack/query-core'
import type { SolidInfiniteQueryOptions } from './types'
import type { Accessor } from 'solid-js'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = Accessor<
  SolidInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  > & {
    initialData?: undefined
  }
>

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  // should we handle page param correctly
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = Accessor<
  SolidInfiniteQueryOptions<
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
>
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      undefined
    >
  >,
): ReturnType<
  DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      InfiniteQueryMode
    >
  >,
): ReturnType<
  DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      undefined
    >
  >,
): ReturnType<
  UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      InfiniteQueryMode
    >
  >,
): ReturnType<
  UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}

export function infiniteQueryOptions(options: unknown) {
  return options
}
