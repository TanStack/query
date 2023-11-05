/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

export * from './types'

export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export { queryOptions } from './queryOptions'

export { infiniteQueryOptions } from './infiniteQueryOptions'

export * from './injectIsFetching'
export * from './injectIsMutating'
export * from './injectMutation'
export * from './injectQueries'
export * from './injectQuery'
export { injectQueryClient, provideQueryClient } from './injectQueryClient'
export * from './providers'
