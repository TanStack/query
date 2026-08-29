/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Solid Query
export * from './types'

export type {
  DefinedUseBaseQueryResult,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  InfiniteQueryOptions,
  MutationOptions,
  QueryOptions,
  UseBaseMutationResult,
  UseBaseQueryOptions,
  UseBaseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'

export { QueryClient } from './QueryClient'
export type {
  QueryObserverOptions,
  DefaultOptions,
  QueryClientConfig,
  InfiniteQueryObserverOptions,
} from './QueryClient'
export { useQuery } from './useQuery'
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export {
  FLIGHT_DATA_SOURCE,
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export { useIsFetching } from './useIsFetching'
export { useInfiniteQuery } from './useInfiniteQuery'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { useMutation } from './useMutation'
export { mutationOptions } from './mutationOptions'
export { useIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { useQueries } from './useQueries'
export { useIsRestoring, IsRestoringContext } from './isRestoring'
