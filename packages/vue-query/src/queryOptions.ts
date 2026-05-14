import type { DeepUnwrapRef, MaybeRefOrGetter, ShallowOption } from './types'
import type {
  DataTag,
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryBooleanOption,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'

export type QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'enabled'
    ?
        | MaybeRefOrGetter<boolean | undefined>
        | (() => QueryBooleanOption<
            TQueryFnData,
            TError,
            TQueryData,
            DeepUnwrapRef<TQueryKey>
          >)
    : Property extends 'queryKey'
      ? MaybeRefOrGetter<TQueryKey>
      : QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          DeepUnwrapRef<TQueryKey>
        >[Property]
} & ShallowOption

export type UndefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

export type DefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => DefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): () => DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => UndefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): () => UndefinedInitialQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions(options: unknown) {
  return options
}
