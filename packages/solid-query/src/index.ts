// Re-export core
export * from '@tanstack/query-core'

// Solid Query
export * from "./types"
// export { useQueries } from './useQueries'
// export type { QueriesResults, QueriesOptions } from './useQueries'
export { createQuery } from './createQuery'
export {
  QueryClientContext as defaultContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
// export type { QueryClientProviderProps } from './QueryClientProvider'
// export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
// export { useHydrate, Hydrate } from './Hydrate'
// export type { HydrateProps } from './Hydrate'
// export {
//   QueryErrorResetBoundary,
//   useQueryErrorResetBoundary,
// } from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { createMutation } from './createMutation'
// export { useInfiniteQuery } from './useInfiniteQuery'
// export { useIsRestoring, IsRestoringProvider } from './isRestoring'
