/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// things that can be imported in server components and client components
export * from './types'
export type { QueriesResults, QueriesOptions } from './useQueries'
export { queryOptions } from './queryOptions'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export { HydrationBoundary } from './HydrationBoundary'
export type { HydrationBoundaryProps } from './HydrationBoundary'
