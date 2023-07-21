/* istanbul ignore file */

export { CancelledError } from './retryer'
export { QueryCache } from './queryCache'
export type { QueryCacheNotifyEvent } from './queryCache'
export { QueryClient } from './queryClient'
export { QueryObserver } from './queryObserver'
export { QueriesObserver } from './queriesObserver'
export { InfiniteQueryObserver } from './infiniteQueryObserver'
export { MutationCache } from './mutationCache'
export { MutationObserver } from './mutationObserver'
export { notifyManager } from './notifyManager'
export { focusManager } from './focusManager'
export { onlineManager } from './onlineManager'
export {
  hashQueryKey,
  replaceEqualDeep,
  isError,
  isServer,
  matchQuery,
  parseQueryArgs,
  parseFilterArgs,
  parseMutationFilterArgs,
  parseMutationArgs,
} from './utils'
export type { MutationFilters, QueryFilters, Updater } from './utils'
export { isCancelledError } from './retryer'
export {
  dehydrate,
  hydrate,
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
} from './hydration'

// Types
export * from './types'
export type { Query, QueryState } from './query'
export type { Mutation } from './mutation'
export type { Logger } from './logger'
export type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
  ShouldDehydrateMutationFunction,
  ShouldDehydrateQueryFunction,
} from './hydration'
