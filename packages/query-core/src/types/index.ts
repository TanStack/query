/* istanbul ignore file */

// Re-export all types for backwards compatibility

// Common/utility types
export type {
  NonUndefinedGuard,
  DistributiveOmit,
  OmitKeyof,
  Override,
  NoInfer,
  Register,
  DefaultError,
  WithRequired,
  NetworkMode,
  CancelOptions,
  SetDataOptions,
  NotifyEventType,
  NotifyEvent,
  ResultOptions,
} from './common'

// Query types
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './query'

export type {
  dataTagSymbol as dataTagSymbolType,
  dataTagErrorSymbol as dataTagErrorSymbolType,
  UnsetMarker,
  QueryKey,
  AnyDataTag,
  DataTag,
  InferDataFromTag,
  InferErrorFromTag,
  QueryFunction,
  StaleTime,
  StaleTimeFunction,
  Enabled,
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
  QueryOptions,
  InitialPageParam,
  InfiniteQueryPageParamsOptions,
  ThrowOnError,
  FetchQueryOptions,
  EnsureQueryDataOptions,
  EnsureInfiniteQueryDataOptions,
  FetchInfiniteQueryOptions,
  RefetchOptions,
  InvalidateQueryFilters,
  RefetchQueryFilters,
  InvalidateOptions,
  ResetOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  QueryStatus,
  FetchStatus,
} from './query'

// Observer types
export type {
  NotifyOnChangeProps,
  QueryObserverOptions,
  DefaultedQueryObserverOptions,
  InfiniteQueryObserverOptions,
  DefaultedInfiniteQueryObserverOptions,
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
} from './observer'

// Mutation types
export type {
  MutationKey,
  MutationStatus,
  MutationScope,
  MutationMeta,
  MutationFunctionContext,
  MutationFunction,
  MutationOptions,
  MutationObserverOptions,
  MutateOptions,
  MutateFunction,
  MutationObserverBaseResult,
  MutationObserverIdleResult,
  MutationObserverLoadingResult,
  MutationObserverErrorResult,
  MutationObserverSuccessResult,
  MutationObserverResult,
} from './mutation'

// Client configuration types
export type { QueryClientConfig, DefaultOptions } from './client'
