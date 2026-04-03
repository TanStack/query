import type {
  DataTag,
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateManualInfiniteQueryOptions,
} from './types'

type OptionalInitialData<TQueryFnData, TPageParam> = {
  initialData?:
    | undefined
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | InitialDataFunction<
        NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      >
}

type RequiredInitialData<TQueryFnData, TPageParam> = {
  initialData:
    | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
    | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
    | undefined
}

type WithoutSkipTokenQueryFn<TOptions extends { queryFn?: unknown }> =
  OmitKeyof<TOptions, 'queryFn'> & {
    queryFn?: Exclude<TOptions['queryFn'], SkipToken | undefined>
  }

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
> &
  OptionalInitialData<TQueryFnData, TPageParam>

export type ManualUndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateManualInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  OptionalInitialData<TQueryFnData, TPageParam>

export type UnusedSkipTokenManualInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = WithoutSkipTokenQueryFn<
  CreateManualInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
>

export type UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
> = WithoutSkipTokenQueryFn<
  CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >
>

export type ManualDefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateManualInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  RequiredInitialData<TQueryFnData, TPageParam>

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
> = CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
> &
  RequiredInitialData<TQueryFnData, TPageParam>

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
  options: ManualDefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): ManualDefinedInitialDataInfiniteOptions<
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
  options: UnusedSkipTokenInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >,
): UnusedSkipTokenInfiniteOptions<
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
  options: UnusedSkipTokenManualInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UnusedSkipTokenManualInfiniteOptions<
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
  options: ManualUndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): ManualUndefinedInitialDataInfiniteOptions<
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
export function infiniteQueryOptions(options: unknown) {
  return options
}
