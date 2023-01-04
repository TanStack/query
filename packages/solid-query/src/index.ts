/* istanbul ignore file */

// Side Effects
import './setBatchUpdatesFn'

// Re-export core
export * from '@tanstack/query-core'

// Solid Query
export * from './types'
export { createQuery } from './createQuery'
export {
  defaultContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export { useIsFetching } from './useIsFetching'
export { createInfiniteQuery } from './createInfiniteQuery'
export { createMutation } from './createMutation'
export { useIsMutating } from './useIsMutating'
export { createQueries } from './createQueries'
