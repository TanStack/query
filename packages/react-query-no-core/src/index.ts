/* istanbul ignore file */

// Public cache and observer API
export { focusManager } from './runtime/focusManager'
export type { FocusManager } from './runtime/focusManager'
export { environmentManager } from './runtime/environmentManager'
export {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  dehydrateQuery,
  hydrate,
} from './runtime/hydration'
export { InfiniteQueryObserver } from './runtime/infiniteQueryObserver'
export { MutationCache } from './runtime/mutationCache'
export type {
  MutationCacheNotifyEvent,
  MutationCacheConfig,
} from './runtime/mutationCache'
export { MutationObserver } from './runtime/mutationObserver'
export { defaultScheduler, notifyManager } from './runtime/notifyManager'
export { onlineManager } from './runtime/onlineManager'
export type { OnlineManager } from './runtime/onlineManager'
export { QueriesObserver } from './runtime/queriesObserver'
export { QueryCache } from './runtime/queryCache'
export type {
  QueryCacheNotifyEvent,
  QueryCacheConfig,
} from './runtime/queryCache'
export { QueryClient } from './runtime/queryClient'
export type { QueryRuntime } from './runtime/runtimeBinding'
export { QueryObserver } from './runtime/queryObserver'
export type {
  QueryObserverResultReader,
  ManagedTimerId,
  TimeoutCallback,
  TimeoutProvider,
  DefaultQueryFn,
  SkipToken,
  Updater,
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
} from '@tanstack/query-types/bindings'
export { CancelledError } from './runtime/retryer'
export { timeoutManager } from './runtime/timeoutManager'
export type { TimeoutManager } from './runtime/timeoutManager'
export {
  hashKey,
  keepPreviousData,
  matchMutation,
  matchQuery,
  noop,
  partialMatchKey,
  replaceEqualDeep,
  shouldThrowError,
  defaultQueryFn,
  skipToken,
} from './runtime/utils'
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
export { useSuspenseInfiniteQuery } from './useSuspenseInfiniteQuery'
export { useSuspenseQueries } from './useSuspenseQueries'
export type {
  SuspenseQueriesResults,
  SuspenseQueriesOptions,
} from './useSuspenseQueries'
export { usePrefetchQuery } from './usePrefetchQuery'
export { usePrefetchInfiniteQuery } from './usePrefetchInfiniteQuery'
export { queryOptions } from './queryOptions'
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
