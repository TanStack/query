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

export type { InjectQueryOptions } from './inject-query'
export { injectQuery } from './inject-query'

// Resource-shaped APIs (Angular >= 22). These are backed by the same QueryClient,
// observers and cache as their `inject*` counterparts — they only change how the
// result is presented (as an Angular `Resource`).
export { queryResource } from './query-resource'
export { infiniteQueryResource } from './infinite-query-resource'
export { mutationResource } from './mutation-resource'
export { toResourceSnapshot } from './resource/to-resource-snapshot'
export type {
  BaseQueryResource,
  CreateQueryResourceResult,
  CreateInfiniteQueryResourceResult,
  MutationResource,
  QueryResourceConfig,
  QueryResourceOptionsFn,
  QueryResourceInjectorOptions,
  InfiniteQueryResourceConfig,
  InfiniteQueryResourceOptionsFn,
  MutationResourceConfig,
  MutationResourceOptionsFn,
} from './resource/resource-types'

export { injectQueryClient } from './inject-query-client'

export type {
  DevtoolsFeature,
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
