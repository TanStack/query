/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export * from './types'
export * from './context'
export { createQuery } from './createQuery'
export { createQueries } from './createQueries'
export { createInfiniteQuery } from './createInfiniteQuery'
export { createMutation } from './createMutation'
export { useQueryClient } from './useQueryClient'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { useIsRestoring } from './useIsRestoring'
export { useHydrate } from './useHydrate'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
