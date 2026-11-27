import type { DefaultRuntime } from './contracts'
import type {
  DehydrateOptions as SharedDehydrateOptions,
  HydrateOptions as SharedHydrateOptions,
} from './hydration'
import type {
  MutationCacheConfig as SharedMutationCacheConfig,
  MutationCacheNotifyEvent as SharedMutationCacheNotifyEvent,
} from './mutationCache'
import type {
  FetchContext as SharedFetchContext,
  QueryBehavior as SharedQueryBehavior,
} from './query'
import type {
  QueryCacheConfig as SharedQueryCacheConfig,
  QueryCacheNotifyEvent as SharedQueryCacheNotifyEvent,
  QueryStore as SharedQueryStore,
} from './queryCache'
import type {
  ObserverOptionsInput as SharedObserverOptionsInput,
  QueryObserverResultContext as SharedQueryObserverResultContext,
} from './queryObserver'
import type {
  DefaultError,
  DefaultOptions as SharedDefaultOptions,
  DefaultedInfiniteQueryObserverOptions as SharedDefaultedInfiniteQueryObserverOptions,
  DefaultedQueryObserverOptions as SharedDefaultedQueryObserverOptions,
  InfiniteData,
  InfiniteQueryExecuteOptions as SharedInfiniteQueryExecuteOptions,
  InfiniteQueryObserverOptions as SharedInfiniteQueryObserverOptions,
  InvalidateQueryFilters as SharedInvalidateQueryFilters,
  MutateFunction as SharedMutateFunction,
  MutateFunctionRest as SharedMutateFunctionRest,
  MutateOptions as SharedMutateOptions,
  MutationFunction as SharedMutationFunction,
  MutationFunctionContext as SharedMutationFunctionContext,
  MutationObserverBaseResult as SharedMutationObserverBaseResult,
  MutationObserverErrorResult as SharedMutationObserverErrorResult,
  MutationObserverIdleResult as SharedMutationObserverIdleResult,
  MutationObserverLoadingResult as SharedMutationObserverLoadingResult,
  MutationObserverOptions as SharedMutationObserverOptions,
  MutationObserverResult as SharedMutationObserverResult,
  MutationObserverSuccessResult as SharedMutationObserverSuccessResult,
  MutationOptions as SharedMutationOptions,
  PlaceholderDataFunction as SharedPlaceholderDataFunction,
  QueryBooleanOption as SharedQueryBooleanOption,
  QueryClientConfig as SharedQueryClientConfig,
  QueryExecuteOptions as SharedQueryExecuteOptions,
  QueryFunction as SharedQueryFunction,
  QueryFunctionContext as SharedQueryFunctionContext,
  QueryKey,
  QueryObserverOptions as SharedQueryObserverOptions,
  QueryObserverOptionsBase as SharedQueryObserverOptionsBase,
  QueryOptions as SharedQueryOptions,
  QueryPersister as SharedQueryPersister,
  RefetchQueryFilters as SharedRefetchQueryFilters,
  StaleTimeFunction as SharedStaleTimeFunction,
  ThrowOnError as SharedThrowOnError,
} from './types'
import type {
  MutationFilters as SharedMutationFilters,
  QueryFilters as SharedQueryFilters,
} from './utils'
export type { IsServerValue } from './environmentManager'
export type { DehydratedState } from './hydration'
export type { MutationState, MutationAction } from './mutation'
export type {
  QueriesObserverResultReader,
  QueriesObserverOptions,
} from './queriesObserver'
export type {
  QueryState,
  FetchDirection,
  FetchMeta,
  FetchOptions,
  QueryAction,
} from './query'
export type { QueryObserverResultReader } from './queryObserver'
export type { Retryer, RetryValue, RetryDelayValue } from './retryer'
export type {
  TimeoutCallback,
  ManagedTimerId,
  TimeoutProvider,
} from './timeoutManager'
export type {
  NonUndefinedGuard,
  DistributiveOmit,
  OmitKeyof,
  Override,
  Register,
  DefaultError,
  QueryKey,
  dataTagSymbol,
  dataTagErrorSymbol,
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
} from './types'
export type {
  Updater,
  QueryTypeFilter,
  SkipToken,
  DefaultQueryFn,
  FetchSignalContext,
} from './utils'
export type DehydrateOptions = SharedDehydrateOptions<DefaultRuntime>
export type HydrateOptions = SharedHydrateOptions<DefaultRuntime>
export type MutationCacheConfig = SharedMutationCacheConfig<DefaultRuntime>
export type MutationCacheNotifyEvent =
  SharedMutationCacheNotifyEvent<DefaultRuntime>
export type FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedFetchContext<DefaultRuntime, TQueryFnData, TError, TData, TQueryKey>
export type QueryBehavior<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedQueryBehavior<DefaultRuntime, TQueryFnData, TError, TData, TQueryKey>
export type QueryCacheConfig = SharedQueryCacheConfig<DefaultRuntime>
export type QueryCacheNotifyEvent = SharedQueryCacheNotifyEvent<DefaultRuntime>
export type QueryStore = SharedQueryStore<DefaultRuntime>
export type QueryObserverResultContext<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> = SharedQueryObserverResultContext<
  DefaultRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
>
export type ObserverOptionsInput<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedObserverOptionsInput<
  DefaultRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
>
export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryFunction<DefaultRuntime, T, TQueryKey, TPageParam>
export type StaleTimeFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedStaleTimeFunction<
  DefaultRuntime,
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
> = SharedQueryBooleanOption<
  DefaultRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>
export type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryPersister<DefaultRuntime, T, TQueryKey, TPageParam>
export type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryFunctionContext<DefaultRuntime, TQueryKey, TPageParam>
export type PlaceholderDataFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedPlaceholderDataFunction<
  DefaultRuntime,
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
> = SharedQueryOptions<
  DefaultRuntime,
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
> = SharedThrowOnError<
  DefaultRuntime,
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
> = SharedQueryObserverOptionsBase<
  DefaultRuntime,
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
> = SharedQueryObserverOptions<
  DefaultRuntime,
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
> = SharedDefaultedQueryObserverOptions<
  DefaultRuntime,
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
> = SharedInfiniteQueryObserverOptions<
  DefaultRuntime,
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
> = SharedDefaultedInfiniteQueryObserverOptions<
  DefaultRuntime,
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
> = SharedQueryExecuteOptions<
  DefaultRuntime,
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
> = SharedInfiniteQueryExecuteOptions<
  DefaultRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>
export type InvalidateQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  SharedInvalidateQueryFilters<DefaultRuntime, TQueryKey>
export type RefetchQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  SharedRefetchQueryFilters<DefaultRuntime, TQueryKey>
export type MutationFunctionContext =
  SharedMutationFunctionContext<DefaultRuntime>
export type MutationFunction<
  TData = unknown,
  TVariables = unknown,
> = SharedMutationFunction<DefaultRuntime, TData, TVariables>
export type MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = SharedMutationOptions<
  DefaultRuntime,
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
> = SharedMutationObserverOptions<
  DefaultRuntime,
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
> = SharedMutateOptions<
  DefaultRuntime,
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
> = SharedMutateFunctionRest<
  DefaultRuntime,
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
> = SharedMutateFunction<
  DefaultRuntime,
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
> = SharedMutationObserverBaseResult<
  DefaultRuntime,
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
> = SharedMutationObserverIdleResult<
  DefaultRuntime,
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
> = SharedMutationObserverLoadingResult<
  DefaultRuntime,
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
> = SharedMutationObserverErrorResult<
  DefaultRuntime,
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
> = SharedMutationObserverSuccessResult<
  DefaultRuntime,
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
> = SharedMutationObserverResult<
  DefaultRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>
export type QueryClientConfig = SharedQueryClientConfig<DefaultRuntime>
export type DefaultOptions<TError = DefaultError> = SharedDefaultOptions<
  DefaultRuntime,
  TError
>
export type QueryFilters<TQueryKey extends QueryKey = QueryKey> =
  SharedQueryFilters<DefaultRuntime, TQueryKey>
export type MutationFilters<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = SharedMutationFilters<
  DefaultRuntime,
  TData,
  TError,
  TVariables,
  TOnMutateResult
>
export type { QueryClient } from './contracts'
export type { QueryCache } from './contracts'
export type { MutationCache } from './contracts'
export type { Query } from './contracts'
export type { Mutation } from './contracts'
export type { QueryObserver } from './contracts'
export type { MutationObserver } from './contracts'
