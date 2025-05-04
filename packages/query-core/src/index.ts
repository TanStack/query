/* istanbul ignore file */

export { CancelledError } from './retryer'
export { QueryCache } from './queryCache'
export type { QueryCacheNotifyEvent } from './queryCache'
export { QueryClient } from './queryClient'
export { QueryObserver } from './queryObserver'
export { QueriesObserver } from './queriesObserver'
export { InfiniteQueryObserver } from './infiniteQueryObserver'
export { MutationCache } from './mutationCache'
export type { MutationCacheNotifyEvent } from './mutationCache'
export { MutationObserver } from './mutationObserver'
export { notifyManager, defaultScheduler } from './notifyManager'
export { focusManager } from './focusManager'
export { onlineManager } from './onlineManager'
export {
  hashKey,
  replaceEqualDeep,
  isServer,
  matchQuery,
  matchMutation,
  keepPreviousData,
  skipToken,
} from './utils'
export type { MutationFilters, QueryFilters, Updater, SkipToken } from './utils'
export { isCancelledError } from './retryer'
export {
  dehydrate,
  hydrate,
  defaultShouldDehydrateQuery,
  defaultShouldDehydrateMutation,
} from './hydration'

export { streamedQuery as experimental_streamedQuery } from './streamedQuery'

// Types
export * from './types'
export type { QueryState } from './query'
export { Query } from './query'
export type { MutationState } from './mutation'
export { Mutation } from './mutation'
export type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
} from './hydration'
export type { QueriesObserverOptions } from './queriesObserver'
