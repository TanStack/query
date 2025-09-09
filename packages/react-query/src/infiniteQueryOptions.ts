import type { UseInfiniteQueryOptions } from './types'
import type {
  InfiniteData,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'

type UseInfiniteQueryOptionsOmitted<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'onSuccess' | 'onError' | 'onSettled' | 'refetchInterval'
>

type ProhibitedInfiniteQueryOptionsKeyInV5 = keyof Pick<
  UseInfiniteQueryOptionsOmitted,
  'useErrorBoundary' | 'suspense'
>

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseInfiniteQueryOptionsOmitted<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseInfiniteQueryOptionsOmitted<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData>>)
    | undefined
}

export function infiniteQueryOptions<
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequired<
    OmitKeyof<
      DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey>,
      ProhibitedInfiniteQueryOptionsKeyInV5
    >,
    'queryKey'
  >,
): WithRequired<
  OmitKeyof<
    DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey>,
    ProhibitedInfiniteQueryOptionsKeyInV5
  >,
  'queryKey'
>

export function infiniteQueryOptions<
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequired<
    OmitKeyof<
      UndefinedInitialDataInfiniteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >,
      ProhibitedInfiniteQueryOptionsKeyInV5
    >,
    'queryKey'
  >,
): WithRequired<
  OmitKeyof<
    UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey>,
    ProhibitedInfiniteQueryOptionsKeyInV5
  >,
  'queryKey'
>

export function infiniteQueryOptions(options: unknown) {
  return options
}
