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
  InfiniteData,
  QueryKey,
  DefaultOptions as SharedDefaultOptions,
  DefaultedInfiniteQueryObserverOptions as SharedDefaultedInfiniteQueryObserverOptions,
  DefaultedQueryObserverOptions as SharedDefaultedQueryObserverOptions,
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
type DehydrateOptions = SharedDehydrateOptions<DefaultRuntime>
type HydrateOptions = SharedHydrateOptions<DefaultRuntime>
type MutationCacheConfig = SharedMutationCacheConfig<DefaultRuntime>
type MutationCacheNotifyEvent = SharedMutationCacheNotifyEvent<DefaultRuntime>
type FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedFetchContext<DefaultRuntime, TQueryFnData, TError, TData, TQueryKey>
type QueryBehavior<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = SharedQueryBehavior<DefaultRuntime, TQueryFnData, TError, TData, TQueryKey>
type QueryCacheConfig = SharedQueryCacheConfig<DefaultRuntime>
type QueryCacheNotifyEvent = SharedQueryCacheNotifyEvent<DefaultRuntime>
type QueryStore = SharedQueryStore<DefaultRuntime>
type QueryObserverResultContext<
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
type ObserverOptionsInput<
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
type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryFunction<DefaultRuntime, T, TQueryKey, TPageParam>
type StaleTimeFunction<
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
type QueryBooleanOption<
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
type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryPersister<DefaultRuntime, T, TQueryKey, TPageParam>
type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = SharedQueryFunctionContext<DefaultRuntime, TQueryKey, TPageParam>
type PlaceholderDataFunction<
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
type QueryOptions<
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
type ThrowOnError<
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
type QueryObserverOptionsBase<
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
type QueryObserverOptions<
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
type DefaultedQueryObserverOptions<
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
type InfiniteQueryObserverOptions<
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
type DefaultedInfiniteQueryObserverOptions<
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
type QueryExecuteOptions<
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
type InfiniteQueryExecuteOptions<
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
type InvalidateQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  SharedInvalidateQueryFilters<DefaultRuntime, TQueryKey>
type RefetchQueryFilters<TQueryKey extends QueryKey = QueryKey> =
  SharedRefetchQueryFilters<DefaultRuntime, TQueryKey>
type MutationFunctionContext = SharedMutationFunctionContext<DefaultRuntime>
type MutationFunction<
  TData = unknown,
  TVariables = unknown,
> = SharedMutationFunction<DefaultRuntime, TData, TVariables>
type MutationOptions<
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
type MutationObserverOptions<
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
type MutateOptions<
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
type MutateFunctionRest<
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
type MutateFunction<
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
type MutationObserverBaseResult<
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
type MutationObserverIdleResult<
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
type MutationObserverLoadingResult<
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
type MutationObserverErrorResult<
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
type MutationObserverSuccessResult<
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
type MutationObserverResult<
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
type QueryClientConfig = SharedQueryClientConfig<DefaultRuntime>
type DefaultOptions<TError = DefaultError> = SharedDefaultOptions<
  DefaultRuntime,
  TError
>
type QueryFilters<TQueryKey extends QueryKey = QueryKey> = SharedQueryFilters<
  DefaultRuntime,
  TQueryKey
>
type MutationFilters<
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
export type {
  FocusManager,
  OnlineManager,
  TimeoutManager,
  QueriesObserver,
  InfiniteQueryObserver,
  CancelledError,
} from './contracts'

export type {
  DehydrateOptions,
  HydrateOptions,
  MutationCacheConfig,
  MutationCacheNotifyEvent,
  FetchContext,
  QueryBehavior,
  QueryCacheConfig,
  QueryCacheNotifyEvent,
  QueryStore,
  QueryObserverResultContext,
  ObserverOptionsInput,
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
  QueryFilters,
  MutationFilters,
}
