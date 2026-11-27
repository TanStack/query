import type * as Shared from '@tanstack/query-types/bindings'
import type {
  DefaultError,
  InfiniteData,
  QueryKey,
  UnsetMarker as unsetMarkerType,
  dataTagErrorSymbol as dataTagErrorSymbolType,
  dataTagSymbol as dataTagSymbolType,
} from '@tanstack/query-types/bindings'
import type { QueryClientPlugin } from './clientFeatures'
import type { QueryRuntime } from './runtimeBinding'

export const dataTagSymbol: dataTagSymbolType = Symbol.for(
  '@tanstack/query/dataTagSymbol',
) as dataTagSymbolType
/**
 * The type of the `dataTagSymbol` key, under which a {@link DataTag} stores its data type.
 */
export type dataTagSymbol = typeof dataTagSymbol
export const dataTagErrorSymbol: dataTagErrorSymbolType = Symbol.for(
  '@tanstack/query/dataTagErrorSymbol',
) as dataTagErrorSymbolType
/**
 * The type of the `dataTagErrorSymbol` key, under which a {@link DataTag} stores its error type.
 */
export type dataTagErrorSymbol = typeof dataTagErrorSymbol
export const unsetMarker: unsetMarkerType = Symbol.for(
  '@tanstack/query/unsetMarker',
) as unsetMarkerType

export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunction<QueryRuntime, T, TQueryKey, TPageParam>

export type StaleTimeFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.StaleTimeFunction<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

export type QueryBooleanOption<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.QueryBooleanOption<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

export type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryPersister<QueryRuntime, T, TQueryKey, TPageParam>

export type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunctionContext<QueryRuntime, TQueryKey, TPageParam>

// oxlint-disable-next-line typescript/no-unsafe-function-type -- excludes every function-like value, including constructors, from the value branch

export type PlaceholderDataFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.PlaceholderDataFunction<
  QueryRuntime,
  TQueryFnData,
  TError,
  TQueryData,
  TQueryKey
>

export type QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type ThrowOnError<
  TQueryFnData,
  TError,
  TQueryData,
  TQueryKey extends QueryKey,
> = Shared.ThrowOnError<
  QueryRuntime,
  TQueryFnData,
  TError,
  TQueryData,
  TQueryKey
>

export type QueryObserverOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryObserverOptionsBase<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type QueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryObserverOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type DefaultedQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.DefaultedQueryObserverOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Shared.InfiniteQueryObserverOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Shared.DefaultedInfiniteQueryObserverOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type QueryExecuteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryExecuteOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type InfiniteQueryExecuteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Shared.InfiniteQueryExecuteOptions<
  QueryRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type InvalidateQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.InvalidateQueryFilters<QueryRuntime, TQueryKey>

export type RefetchQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.RefetchQueryFilters<QueryRuntime, TQueryKey>

export type MutationFunctionContext =
  Shared.MutationFunctionContext<QueryRuntime>

export type MutationFunction<
  TData = unknown,
  TVariables = unknown,
> = Shared.MutationFunction<QueryRuntime, TData, TVariables>

export type MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationOptions<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverOptions<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutateOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutateOptions<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutateFunctionRest<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutateFunctionRest<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutateFunction<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverBaseResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverIdleResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverIdleResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverLoadingResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverErrorResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverErrorResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverSuccessResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type MutationObserverResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Shared.MutationObserverResult<
  QueryRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>

export type QueryClientConfig = Shared.QueryClientConfig<QueryRuntime> & {
  plugins?: ReadonlyArray<QueryClientPlugin>
}

export type DefaultOptions<TError = DefaultError> = Shared.DefaultOptions<
  QueryRuntime,
  TError
>

export type {
  NonUndefinedGuard,
  DistributiveOmit,
  OmitKeyof,
  Override,
  Register,
  DefaultError,
  QueryKey,
  UnsetMarker,
  AnyDataTag,
  DataTag,
  QueryKeyWithDataTag,
  InferDataFromTag,
  InferErrorFromTag,
  StaleTime,
  InitialDataFunction,
  QueriesPlaceholderDataFunction,
  EqualityFn,
  CacheKeyHashFunction,
  CacheKeyConfig,
  GetPreviousPageParamFunction,
  GetNextPageParamFunction,
  InfiniteData,
  QueryMeta,
  NetworkMode,
  NotifyOnChangeProps,
  InitialPageParam,
  InfiniteQueryPageParamsOptions,
  WithRequired,
  ResultOptions,
  RefetchOptions,
  InvalidateOptions,
  ResetOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  QueryStatus,
  FetchStatus,
  QueryObserverBaseResult,
  QueryObserverPendingResult,
  QueryObserverLoadingResult,
  QueryObserverLoadingErrorResult,
  QueryObserverRefetchErrorResult,
  QueryObserverSuccessResult,
  QueryObserverPlaceholderResult,
  DefinedQueryObserverResult,
  QueryObserverResult,
  InfiniteQueryObserverBaseResult,
  InfiniteQueryObserverPendingResult,
  InfiniteQueryObserverLoadingResult,
  InfiniteQueryObserverLoadingErrorResult,
  InfiniteQueryObserverRefetchErrorResult,
  InfiniteQueryObserverSuccessResult,
  InfiniteQueryObserverPlaceholderResult,
  DefinedInfiniteQueryObserverResult,
  InfiniteQueryObserverResult,
  MutationKey,
  MutationStatus,
  MutationScope,
  MutationMeta,
  CancelOptions,
  SetDataOptions,
  NotifyEventType,
  NotifyEvent,
} from '@tanstack/query-types/bindings'
