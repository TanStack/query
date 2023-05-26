/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export * from './types'
export { createQuery } from './createQuery'
export { createQueries } from './createQueries'
export { createInfiniteQuery } from './createInfiniteQuery'
export { createMutation } from './createMutation'
export { useQueryClient } from './useQueryClient'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { useHydrate } from './useHydrate'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
