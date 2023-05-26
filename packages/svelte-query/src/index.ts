/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export * from './types.ts'
export { createQuery } from './createQuery.ts'
export { createQueries } from './createQueries.ts'
export { createInfiniteQuery } from './createInfiniteQuery.ts'
export { createMutation } from './createMutation.ts'
export { useQueryClient } from './useQueryClient.ts'
export { useIsFetching } from './useIsFetching.ts'
export { useIsMutating } from './useIsMutating.ts'
export { useHydrate } from './useHydrate.ts'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
