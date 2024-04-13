/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Solid Query
export * from './types'
export { QueryClient } from './QueryClient'
export type {
  QueryObserverOptions,
  DefaultOptions,
  QueryClientConfig,
  InfiniteQueryObserverOptions,
} from './QueryClient'
export { createQuery, queryOptions } from './createQuery'
export {
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export { useIsFetching } from './useIsFetching'
export { createInfiniteQuery } from './createInfiniteQuery'
export { createMutation } from './createMutation'
export { useIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { createQueries } from './createQueries'
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
