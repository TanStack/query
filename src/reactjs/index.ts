// Side effects
import './setBatchUpdatesFn'

export {
  defaultContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { useMutation } from './useMutation'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useHydrate, Hydrate } from './Hydrate'
export { useIsRestoring } from './isRestoring'

// Types
export * from './types'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export type { HydrateProps } from './Hydrate'
export type { QueriesOptions, QueriesResults } from './useQueries'
