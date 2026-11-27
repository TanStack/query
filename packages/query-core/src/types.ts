import type * as Shared from '@tanstack/query-types/bindings'
import type {
  DefaultError,
  InfiniteData,
  QueryKey,
  dataTagErrorSymbol as dataTagErrorSymbolType,
  dataTagSymbol as dataTagSymbolType,
  UnsetMarker as unsetMarkerType,
} from '@tanstack/query-types/bindings'
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

type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunction<QueryRuntime, T, TQueryKey, TPageParam>

type StaleTimeFunction<
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

type QueryBooleanOption<
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

type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryPersister<QueryRuntime, T, TQueryKey, TPageParam>

type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunctionContext<QueryRuntime, TQueryKey, TPageParam>

type PlaceholderDataFunction<
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

type QueryOptions<
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

type ThrowOnError<
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

type QueryObserverOptionsBase<
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

type QueryObserverOptions<
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

type DefaultedQueryObserverOptions<
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

type InfiniteQueryObserverOptions<
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

type DefaultedInfiniteQueryObserverOptions<
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

type QueryExecuteOptions<
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

type InfiniteQueryExecuteOptions<
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

type InvalidateQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.InvalidateQueryFilters<QueryRuntime, TQueryKey>

type RefetchQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.RefetchQueryFilters<QueryRuntime, TQueryKey>

type MutationFunctionContext = Shared.MutationFunctionContext<QueryRuntime>

type MutationFunction<
  TData = unknown,
  TVariables = unknown,
> = Shared.MutationFunction<QueryRuntime, TData, TVariables>

type MutationOptions<
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

type MutationObserverOptions<
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

type MutateOptions<
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

type MutateFunctionRest<
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

type MutateFunction<
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

type MutationObserverBaseResult<
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

type MutationObserverIdleResult<
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

type MutationObserverLoadingResult<
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

type MutationObserverErrorResult<
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

type MutationObserverSuccessResult<
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

type MutationObserverResult<
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

type QueryClientConfig = Shared.QueryClientConfig<QueryRuntime>

type DefaultOptions<TError = DefaultError> = Shared.DefaultOptions<
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

export type {
  QueryFunction,
  StaleTimeFunction,
  QueryBooleanOption,
  QueryPersister,
  QueryFunctionContext,
  PlaceholderDataFunction,
  QueryOptions,
  ThrowOnError,
  QueryObserverOptionsBase,
  QueryObserverOptions,
  DefaultedQueryObserverOptions,
  InfiniteQueryObserverOptions,
  DefaultedInfiniteQueryObserverOptions,
  QueryExecuteOptions,
  InfiniteQueryExecuteOptions,
  InvalidateQueryFilters,
  RefetchQueryFilters,
  MutationFunctionContext,
  MutationFunction,
  MutationOptions,
  MutationObserverOptions,
  MutateOptions,
  MutateFunctionRest,
  MutateFunction,
  MutationObserverBaseResult,
  MutationObserverIdleResult,
  MutationObserverLoadingResult,
  MutationObserverErrorResult,
  MutationObserverSuccessResult,
  MutationObserverResult,
  QueryClientConfig,
  DefaultOptions,
}
