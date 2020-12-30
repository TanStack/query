// Side effects
import './setBatchUpdatesFn'
import './setLogger'

export { QueryClientProvider, useQueryClient } from './QueryClientProvider'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useMutation } from './useMutation'
export { useMutationObserver } from './useMutationObserver'
export { useQuery } from './useQuery'
export { useQueries, useQueriesObserver } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useQueryObserver } from './useQueryObserver'

// Types
export * from './types'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
