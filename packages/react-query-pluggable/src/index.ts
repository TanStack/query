/* istanbul ignore file */

// Public cache and observer API
export {
  focusManager,
  environmentManager,
  onlineManager,
  CancelledError,
  timeoutManager,
  hashKey,
  noop,
  partialMatchKey,
  replaceEqualDeep,
  shouldThrowError,
  defaultQueryFn,
  skipToken,
} from '@tanstack/query-core/primitives'
export type {
  FocusManager,
  OnlineManager,
  TimeoutManager,
  ManagedTimerId,
  TimeoutCallback,
  TimeoutProvider,
  DefaultQueryFn,
  SkipToken,
  Updater,
} from '@tanstack/query-core/primitives'
export {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  dehydrateQuery,
  hydrate,
} from './runtime/hydration'
export { infiniteQuery } from './infiniteQuery'
export type { InfiniteQueryMode } from './infiniteQuery'
export { fetchInfiniteQuery } from './runtime/fetchInfiniteQuery'
export { InfiniteQueryObserver } from './runtime/infiniteQueryObserver'
export { MutationCache, getMutationCache } from './runtime/mutationCache'
export type {
  MutationCacheNotifyEvent,
  MutationCacheConfig,
} from './runtime/mutationCache'
export { MutationObserver } from './runtime/mutationObserver'
export { defaultScheduler, notifyManager } from './runtime/notifyManager'
export { QueriesObserver } from './runtime/queriesObserver'
export { QueryCache } from './runtime/queryCache'
export type {
  QueryCacheNotifyEvent,
  QueryCacheConfig,
} from './runtime/queryCache'
export {
  QueryClient,
  mountQueryClient,
  unmountQueryClient,
  isFetching,
  isMutating,
  getQueryData,
  setQueryData,
  getQueryState,
  fetchQuery,
  resumePausedMutations,
  getQueryCache,
  getDefaultOptions,
  setDefaultOptions,
  setQueryDefaults,
  getQueryDefaults,
  setMutationDefaults,
  getMutationDefaults,
  defaultQueryOptions,
  defaultMutationOptions,
  clearQueryClient,
} from './runtime/queryClient'
export {
  getQueriesData,
  setQueriesData,
  removeQueries,
  resetQueries,
  cancelQueries,
  invalidateQueries,
  refetchQueries,
} from './runtime/cacheOperations'

export { serialScope } from './runtime/serialScope'
export type { SerialScope } from './runtime/serialScope'
export { select } from './runtime/select'
export { placeholderData } from './runtime/placeholderData'
export type { Select, PlaceholderData } from './runtime/projectionTypes'
export { refetchInterval } from './runtime/refetchInterval'
export type { RefetchInterval } from './runtime/refetchInterval'
export { QueryObserver } from './runtime/queryObserver'

export { keepPreviousData, matchMutation, matchQuery } from './runtime/utils'
export type { MutationFilters, QueryFilters } from './runtime/utils'
export { streamedQuery } from './runtime/streamedQuery'
export type { DehydrateOptions, HydrateOptions } from './runtime/hydration'
export { Mutation } from './runtime/mutation'
export { Query } from './runtime/query'
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './runtime/types'
export type {
  QueryFunction,
  StaleTimeFunction,
  QueryBooleanOption,
  QueryPersister,
  QueryFunctionContext,
  PlaceholderDataFunction,
  QueryOptions,
  ThrowOnError,
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
} from './runtime/types'

// React Query
export type {
  AnyUseBaseQueryOptions,
  UseBaseQueryOptions,
  UsePrefetchQueryOptions,
  UsePrefetchInfiniteQueryOptions,
  AnyUseQueryOptions,
  UseQueryOptions,
  AnyUseSuspenseQueryOptions,
  UseSuspenseQueryOptions,
  AnyUseInfiniteQueryOptions,
  UseInfiniteQueryOptions,
  AnyUseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryOptions,
  UseBaseQueryResult,
  UseQueryResult,
  UseSuspenseQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryResult,
  DefinedUseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult,
  AnyUseMutationOptions,
  UseMutationOptions,
  UseMutateFunction,
  UseMutateAsyncFunction,
  UseBaseMutationResult,
  UseMutationResult,
} from './types'
export { useQueries } from './useQueries'
export type { QueriesResults, QueriesOptions } from './useQueries'
export { useQuery } from './useQuery'
export { useSuspenseQuery } from './useSuspenseQuery'
export { suspenseQuery } from './suspenseQuery'
export type { SuspenseQueryMode, SuspenseQueryOptions } from './suspenseQuery'
export { useSuspenseInfiniteQuery } from './useSuspenseInfiniteQuery'
export { useSuspenseQueries } from './useSuspenseQueries'
export type {
  SuspenseQueriesResults,
  SuspenseQueriesOptions,
} from './useSuspenseQueries'
export { usePrefetchQuery } from './usePrefetchQuery'
export { usePrefetchInfiniteQuery } from './usePrefetchInfiniteQuery'
export { queryOptions, queryOptions as query } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from './infiniteQueryOptions'
export {
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export { HydrationBoundary } from './HydrationBoundary'
export type { HydrationBoundaryProps } from './HydrationBoundary'
export type {
  QueryErrorClearResetFunction,
  QueryErrorIsResetFunction,
  QueryErrorResetBoundaryFunction,
  QueryErrorResetFunction,
} from './QueryErrorResetBoundary'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating, useMutationState } from './useMutationState'
export { useMutation } from './useMutation'
export { mutationOptions } from './mutationOptions'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useIsRestoring, IsRestoringProvider } from './IsRestoringProvider'

export type {
  QueryObserverResultReader,
  DehydratedState,
  MutationState,
  QueriesObserverOptions,
  QueriesObserverResultReader,
  QueryState,
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
} from '@tanstack/query-core'
