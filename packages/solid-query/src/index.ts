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
export { useQuery } from './useQuery'
export { useQuery as createQuery } from './useQuery'
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export {
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export { useIsFetching } from './useIsFetching'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useInfiniteQuery as createInfiniteQuery } from './useInfiniteQuery'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { useMutation } from './useMutation'
export { useMutation as createMutation } from './useMutation'
export { useIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { useQueries } from './useQueries'
export { useQueries as createQueries } from './useQueries'
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
