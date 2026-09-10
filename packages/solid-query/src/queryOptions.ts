import type {
  DataTag,
  DefaultError,
  QueryFunction,
  QueryKey,
} from '@tanstack/query-core'
import type { QueryOptions } from './types'
import type { Accessor } from 'solid-js'

/** Options that cannot disable the query and carry no `initialData`: `data` is `TData`. */
export type AlwaysEnabledOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
    enabled?: true
    queryFn?: QueryFunction<TQueryFnData, TQueryKey>
  }
>

/** Options without `initialData` that may disable the query: `data` is `TData | undefined`. */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    AlwaysEnabledOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<AlwaysEnabledOptions<TQueryFnData, TError, TData, TQueryKey>> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions(options: unknown) {
  return options
}
