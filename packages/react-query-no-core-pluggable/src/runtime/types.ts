import type * as Shared from '@tanstack/query-types/bindings'
import type {
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/query-types/bindings'
import type { QueryRuntime } from './runtimeBinding'

export const dataTagSymbol: Shared.dataTagSymbol = Symbol.for(
  '@tanstack/query/dataTagSymbol',
) as Shared.dataTagSymbol
/**
 * The type of the `dataTagSymbol` key, under which a {@link DataTag} stores its data type.
 */
export type dataTagSymbol = typeof dataTagSymbol
export const dataTagErrorSymbol: Shared.dataTagErrorSymbol = Symbol.for(
  '@tanstack/query/dataTagErrorSymbol',
) as Shared.dataTagErrorSymbol
/**
 * The type of the `dataTagErrorSymbol` key, under which a {@link DataTag} stores its error type.
 */
export type dataTagErrorSymbol = typeof dataTagErrorSymbol
export const unsetMarker: Shared.UnsetMarker = Symbol.for(
  '@tanstack/query/unsetMarker',
) as Shared.UnsetMarker

/** {@inheritDoc Shared.QueryFunction} */
export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunction<QueryRuntime, T, TQueryKey, TPageParam>

/** {@inheritDoc Shared.StaleTimeFunction} */
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

/** {@inheritDoc Shared.QueryBooleanOption} */
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

/** {@inheritDoc Shared.QueryPersister} */
export type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryPersister<QueryRuntime, T, TQueryKey, TPageParam>

/** {@inheritDoc Shared.QueryFunctionContext} */
export type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Shared.QueryFunctionContext<QueryRuntime, TQueryKey, TPageParam>

// oxlint-disable-next-line typescript/no-unsafe-function-type -- excludes every function-like value, including constructors, from the value branch

/** {@inheritDoc Shared.PlaceholderDataFunction} */
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

/** {@inheritDoc Shared.QueryOptions} */
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

/** {@inheritDoc Shared.ThrowOnError} */
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

/** {@inheritDoc Shared.QueryObserverOptionsBase} */
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

/** {@inheritDoc Shared.QueryObserverOptions} */
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

/** {@inheritDoc Shared.DefaultedQueryObserverOptions} */
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

/** {@inheritDoc Shared.InfiniteQueryObserverOptions} */
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

/** {@inheritDoc Shared.DefaultedInfiniteQueryObserverOptions} */
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

/** {@inheritDoc Shared.QueryExecuteOptions} */
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

/** {@inheritDoc Shared.InfiniteQueryExecuteOptions} */
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

/** {@inheritDoc Shared.InvalidateQueryFilters} */
export type InvalidateQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.InvalidateQueryFilters<QueryRuntime, TQueryKey>

/** {@inheritDoc Shared.RefetchQueryFilters} */
export type RefetchQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  Shared.RefetchQueryFilters<QueryRuntime, TQueryKey>

/** {@inheritDoc Shared.MutationFunctionContext} */
export type MutationFunctionContext =
  Shared.MutationFunctionContext<QueryRuntime>

/** {@inheritDoc Shared.MutationFunction} */
export type MutationFunction<
  TData = unknown,
  TVariables = unknown,
> = Shared.MutationFunction<QueryRuntime, TData, TVariables>

/** {@inheritDoc Shared.MutationOptions} */
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

/** {@inheritDoc Shared.MutationObserverOptions} */
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

/** {@inheritDoc Shared.MutateOptions} */
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

/** {@inheritDoc Shared.MutateFunctionRest} */
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

/** {@inheritDoc Shared.MutateFunction} */
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

/** {@inheritDoc Shared.MutationObserverBaseResult} */
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

/** {@inheritDoc Shared.MutationObserverIdleResult} */
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

/** {@inheritDoc Shared.MutationObserverLoadingResult} */
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

/** {@inheritDoc Shared.MutationObserverErrorResult} */
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

/** {@inheritDoc Shared.MutationObserverSuccessResult} */
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

/** {@inheritDoc Shared.MutationObserverResult} */
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

/** {@inheritDoc Shared.QueryClientConfig} */
export type QueryClientConfig = Shared.QueryClientConfig<QueryRuntime>

/** {@inheritDoc Shared.DefaultOptions} */
export type DefaultOptions<TError = DefaultError> = Shared.DefaultOptions<
  QueryRuntime,
  TError
>

export type {
  OmitKeyof,
  DefaultError,
  QueryKey,
  InferDataFromTag,
  InferErrorFromTag,
  StaleTime,
  InitialDataFunction,
  EqualityFn,
  CacheKeyConfig,
  InfiniteData,
  QueryMeta,
  NetworkMode,
  InfiniteQueryPageParamsOptions,
  WithRequired,
  RefetchOptions,
  InvalidateOptions,
  ResetOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  QueryObserverBaseResult,
  QueryObserverResult,
  InfiniteQueryObserverBaseResult,
  InfiniteQueryObserverResult,
  MutationKey,
  MutationMeta,
  CancelOptions,
  SetDataOptions,
} from '@tanstack/query-types/bindings'
