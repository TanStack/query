// Re-export core
export * from '@tanstack/query-core'

// Side effects
import './setBatchUpdatesFn'

// React Query
export * from './types'
export { QueriesResults, useQueries, QueriesOptions } from './useQueries'
export { useQuery } from './useQuery'
export {
  QueryClientProviderProps,
  defaultContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export { HydrateProps, useHydrate, Hydrate } from './Hydrate'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { useMutation } from './useMutation'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useIsRestoring } from './isRestoring'
