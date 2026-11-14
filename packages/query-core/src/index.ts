/* istanbul ignore file */

export { focusManager } from './focusManager'
export type { FocusManager } from './focusManager'
export { environmentManager } from './environmentManager'
export {
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  dehydrateQuery,
  hydrate,
} from './hydration'
export { InfiniteQueryObserver } from './infiniteQueryObserver'
export { MutationCache } from './mutationCache'
export type { MutationCacheNotifyEvent } from './mutationCache'
export { MutationObserver } from './mutationObserver'
export { defaultScheduler, notifyManager } from './notifyManager'
export { onlineManager } from './onlineManager'
export type { OnlineManager } from './onlineManager'
export { PauseManager } from './pauseManager'
export { QueriesObserver } from './queriesObserver'
export { QueryCache } from './queryCache'
export type { QueryCacheNotifyEvent } from './queryCache'
export { QueryClient } from './queryClient'
export { QueryObserver } from './queryObserver'
export { CancelledError, isCancelledError } from './retryer'
export {
  timeoutManager,
  type ManagedTimerId,
  type TimeoutCallback,
  type TimeoutManager,
  type TimeoutProvider,
} from './timeoutManager'
export {
  hashKey,
  isServer,
  keepPreviousData,
  matchMutation,
  matchQuery,
  noop,
  partialMatchKey,
  replaceEqualDeep,
  shouldThrowError,
  skipToken,
} from './utils'
export type { MutationFilters, QueryFilters, SkipToken, Updater } from './utils'

export { streamedQuery as experimental_streamedQuery } from './streamedQuery'

// Types
export type {
  DehydratedState,
  DehydrateOptions,
  HydrateOptions,
} from './hydration'
export { Mutation } from './mutation'
export type { MutationState } from './mutation'
export type { MutationCacheConfig } from './mutationCache'
export type { QueriesObserverOptions } from './queriesObserver'
export { Query } from './query'
export type { QueryState } from './query'
export type { QueryCacheConfig } from './queryCache'
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './types'
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
  QueryFunction,
  StaleTime,
  StaleTimeFunction,
  QueryBooleanOption,
  QueryPersister,
  QueryFunctionContext,
  InitialDataFunction,
  PlaceholderDataFunction,
  QueriesPlaceholderDataFunction,
  QueryKeyHashFunction,
  GetPreviousPageParamFunction,
  GetNextPageParamFunction,
  InfiniteData,
  QueryMeta,
  NetworkMode,
  NotifyOnChangeProps,
  QueryOptions,
  InitialPageParam,
  InfiniteQueryPageParamsOptions,
  ThrowOnError,
  QueryObserverOptions,
  WithRequired,
  DefaultedQueryObserverOptions,
  InfiniteQueryObserverOptions,
  DefaultedInfiniteQueryObserverOptions,
  QueryExecuteOptions,
  FetchQueryOptions,
  EnsureQueryDataOptions,
  EnsureInfiniteQueryDataOptions,
  InfiniteQueryExecuteOptions,
  FetchInfiniteQueryOptions,
  ResultOptions,
  RefetchOptions,
  InvalidateQueryFilters,
  RefetchQueryFilters,
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
  CancelOptions,
  SetDataOptions,
  NotifyEventType,
  NotifyEvent,
} from './types'
