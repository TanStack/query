import { setBatchUpdatesFn, setLogger } from '../core'
import { logger } from './logger'
import { unstable_batchedUpdates } from './reactBatchedUpdates'

setBatchUpdatesFn(unstable_batchedUpdates)

if (logger) {
  setLogger(logger)
}

export { QueryClientProvider, useQueryClient } from './QueryClientProvider'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useMutation } from './useMutation'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'

// Types
export * from './types'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
