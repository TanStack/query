/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

export * from './types'
export type { QueryResource } from './query-resource'
export { toResource } from './query-resource'

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

export { injectInfiniteQuery } from './inject-infinite-query'

export { injectIsFetching } from './inject-is-fetching'

export { injectIsMutating } from './inject-is-mutating'

export { injectIsRestoring } from './inject-is-restoring'

export { injectMutation } from './inject-mutation'

export type { MutationStateOptions } from './inject-mutation-state'
export { injectMutationState } from './inject-mutation-state'

export type {
  InjectQueriesOptions,
  QueriesOptions,
  QueriesResults,
} from './inject-queries.types'
export { injectQueries } from './inject-queries'

export { injectQuery } from './inject-query'

export type { QueryFeature } from './providers'
export {
  provideTanStackQuery,
  withHydrationKey,
  withNoQueryHydration,
} from './providers'
