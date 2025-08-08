/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

export * from './types'

export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from './query-options'
export { queryOptions } from './query-options'

export type { CreateMutationOptions } from './types'
export { mutationOptions } from './mutation-options'

export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from './infinite-query-options'
export { infiniteQueryOptions } from './infinite-query-options'

export type { InjectInfiniteQueryOptions } from './inject-infinite-query'
export { injectInfiniteQuery } from './inject-infinite-query'

export type { InjectIsFetchingOptions } from './inject-is-fetching'
export { injectIsFetching } from './inject-is-fetching'

export type { InjectIsMutatingOptions } from './inject-is-mutating'
export { injectIsMutating } from './inject-is-mutating'

export { injectIsRestoring, provideIsRestoring } from './inject-is-restoring'

export type { InjectMutationOptions } from './inject-mutation'
export { injectMutation } from './inject-mutation'

export type { InjectMutationStateOptions } from './inject-mutation-state'
export { injectMutationState } from './inject-mutation-state'

export type { QueriesOptions, QueriesResults } from './inject-queries'
export { injectQueries } from './inject-queries'

export type { InjectQueryOptions } from './inject-query'
export { injectQuery } from './inject-query'

export { injectQueryClient } from './inject-query-client'

export type {
  DeveloperToolsFeature,
  PersistQueryClientFeature,
  QueryFeature,
  QueryFeatures,
} from './providers'
export {
  provideAngularQuery,
  provideQueryClient,
  provideTanStackQuery,
  queryFeature,
} from './providers'
