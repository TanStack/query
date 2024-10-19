/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export * from './types.js'
export * from './context.js'

export { createQuery } from './createQuery.js'
export { createPrefetchQuery } from './createPrefetchQuery.js'
export type { QueriesResults, QueriesOptions } from './createQueries.js'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js'
export { queryOptions } from './queryOptions.js'
export { createQueries } from './createQueries.js'
export { createInfiniteQuery } from './createInfiniteQuery.js'
export { createPrefetchInfiniteQuery } from './createPrefetchInfiniteQuery.js'
export { infiniteQueryOptions } from './infiniteQueryOptions.js'
export { createMutation } from './createMutation.js'
export { useMutationState } from './useMutationState.js'
export { useQueryClient } from './useQueryClient.js'
export { useIsFetching } from './useIsFetching.js'
export { useIsMutating } from './useIsMutating.js'
export { useIsRestoring } from './useIsRestoring.js'
export { useHydrate } from './useHydrate.js'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
