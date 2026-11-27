/* istanbul ignore file */

export {
  getQueriesData,
  setQueriesData,
  removeQueries,
  resetQueries,
  cancelQueries,
  invalidateQueries,
  refetchQueries,
} from './cacheOperations'
export { environmentManager } from './environmentManager'
export { infiniteQuery } from './infiniteQuery'
export { fetchOptimistic } from './fetchOptimistic'
export { focusManager } from './focusManager'
export type { FocusManager } from './focusManager'
export {
  hydrateQueries,
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  dehydrateQuery,
  hydrate,
} from './hydration'
export type {
  DehydratedState,
  HydrateOptions,
  DehydrateOptions,
} from './hydration'
export { InfiniteQueryObserver } from './infiniteQueryObserver'
export { Mutation } from './mutation'
export type { MutationState } from './mutation'
export { MutationCache, getMutationCache } from './mutationCache'
export type {
  MutationCacheNotifyEvent,
  MutationCacheConfig,
} from './mutationCache'
export { MutationObserver } from './mutationObserver'
export { defaultScheduler, notifyManager } from './notifyManager'
export { onlineManager } from './onlineManager'
export type { OnlineManager } from './onlineManager'
export { placeholderData } from './placeholderData'
export type { Select, PlaceholderData } from './projectionTypes'
export { QueriesObserver } from './queriesObserver'
export type {
  QueriesObserverOptions,
  QueriesObserverResultReader,
} from './queriesObserver'
export { Query, invalidateCachedQuery, resetCachedQuery } from './query'
export type { QueryState } from './query'
export { QueryCache } from './queryCache'
export {
  clearQueryCache,
  findCachedQuery,
  findCachedQueries,
} from './queryCacheOperations'
export {
  getQueryObserverCount,
  isQueryFetched,
  isQueryActive,
  isQueryDisabled,
  isQueryStale,
  isQueryStatic,
} from './queryPredicates'
export type { QueryCacheNotifyEvent, QueryCacheConfig } from './queryCache'
export {
  getQueryCache,
  mountQueryClient,
  unmountQueryClient,
  QueryClient,
  countFetchingQueries,
  isMutating,
  getQueryData,
  setQueryData,
  getQueryState,
  query,
  resumePausedMutations,
  getDefaultOptions,
  setDefaultOptions,
  setQueryDefaults,
  getQueryDefaults,
  setMutationDefaults,
  getMutationDefaults,
  defaultQueryOptions,
  defaultMutationOptions,
  clearQueryClient,
} from './queryClient'
export { QueryObserver } from './queryObserver'
export type { QueryObserverResultReader } from './queryObserver'
export {
  isPending,
  isSuccess,
  isError,
  isFetching,
  isPaused,
  isLoading,
  isRefetching,
  isLoadingError,
  isRefetchError,
  isFetched,
  isFetchingNextPage,
  isFetchingPreviousPage,
  isFetchNextPageError,
  isFetchPreviousPageError,
} from './queryResult'
export { refetchInterval } from './refetchInterval'
export type { RefetchInterval } from './refetchInterval'
export { CancelledError } from './retryer'
export { select } from './select'
export { serialScope } from './serialScope'
export type { SerialScope } from './serialScope'
export { streamedQuery } from './streamedQuery'
export { timeoutManager } from './timeoutManager'
export type {
  TimeoutManager,
  ManagedTimerId,
  TimeoutCallback,
  TimeoutProvider,
} from './timeoutManager'
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './types'
export type {
  OmitKeyof,
  QueryKey,
  QueryObserverResult,
  DefaultedQueryObserverOptions,
  ThrowOnError,
  QueryErrorBoundaryOption,
  QueryErrorBoundaryPolicy,
  QueryFunction,
  StaleTimeFunction,
  QueryBooleanOption,
  QueryPersister,
  QueryFunctionContext,
  PlaceholderDataFunction,
  QueryOptions,
  QueryObserverOptions,
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
  NonUndefinedGuard,
  DistributiveOmit,
  Override,
  Register,
  DefaultError,
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
export {
  shouldThrowError,
  hashKey,
  noop,
  partialMatchKey,
  replaceEqualDeep,
  defaultQueryFn,
  skipToken,
  keepPreviousData,
  matchMutation,
  matchQuery,
} from './utils'
export type {
  DefaultQueryFn,
  SkipToken,
  Updater,
  MutationFilters,
  QueryFilters,
} from './utils'
