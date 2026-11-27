// Shared runtime for adapters with their own query clients and observers.
export { environmentManager, isServer } from './environmentManager'
export type { IsServerValue } from './environmentManager'
export { FocusManager, focusManager } from './focusManager'
export { OnlineManager, onlineManager } from './onlineManager'
export type { Action as MutationAction } from './mutation'
export type {
  Action as QueryAction,
  FetchDirection,
  FetchMeta,
  FetchOptions,
} from './query'
export { fetchState, getDefaultQueryState, successState } from './queryState'
export { Removable } from './removable'
export { CancelledError, canFetch, createRetryer } from './retryer'
export type { Retryer, RetryDelayValue, RetryValue } from './retryer'
export { Subscribable } from './subscribable'
export {
  TimeoutManager,
  defaultTimeoutProvider,
  timeoutManager,
} from './timeoutManager'
export type {
  ManagedTimerId,
  TimeoutCallback,
  TimeoutProvider,
} from './timeoutManager'
export { dataTagSymbol, dataTagErrorSymbol, unsetMarker } from './types'
export type { QueryObserverOptionsBase } from './types'
export {
  addConsumeAwareSignal,
  addToArray,
  defaultQueryFn,
  fetchSignal,
  functionalUpdate,
  hashKey,
  hashKeyByOptions,
  isPlainArray,
  isPlainObject,
  isValidTimeout,
  noop,
  partialMatchKey,
  replaceData,
  replaceEqualDeep,
  shallowEqualObjects,
  shouldThrowError,
  skipToken,
  sleep,
  timeUntilStale,
} from './utils'
export type {
  DefaultQueryFn,
  FetchSignalContext,
  QueryTypeFilter,
  SkipToken,
  Updater,
} from './utils'
