/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// things that can be imported in server components and client components
export * from './types'
export type { QueriesResults, QueriesOptions } from './useQueries'
export type {
  SuspenseQueriesResults,
  SuspenseQueriesOptions,
} from './useSuspenseQueries'
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export type { HydrationBoundaryProps } from './HydrationBoundary'
