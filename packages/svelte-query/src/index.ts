/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export * from './types'
export * from './context'

export { createQuery } from './createQuery'
export type { QueriesResults, QueriesOptions } from './createQueries'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export { queryOptions } from './queryOptions'
export { createQueries } from './createQueries'
export { createInfiniteQuery } from './createInfiniteQuery'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export { createMutation } from './createMutation'
export { createMutationState } from './createMutationState'
export { useQueryClient } from './useQueryClient'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { useIsRestoring } from './useIsRestoring'
export { useHydrate } from './useHydrate'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
