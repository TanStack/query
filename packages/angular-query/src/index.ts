/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

export * from './types'

export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './query-options'
export { queryOptions } from './query-options'
export { mutationOptions } from './mutation-options'
export type { CreateMutationOptions } from './mutation-options'

export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infinite-query-options'
export { infiniteQueryOptions } from './infinite-query-options'

export * from './inject-infinite-query'
export * from './inject-is-fetching'
export * from './inject-is-mutating'
export * from './inject-mutation'
export * from './inject-mutation-state'
export * from './inject-queries'
export * from './inject-query'
export * from './providers'
