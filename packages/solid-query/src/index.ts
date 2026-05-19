/* istanbul ignore file */

import { useQuery } from './useQuery'
import { useInfiniteQuery } from './useInfiniteQuery'
import { useMutation } from './useMutation'
import { useQueries } from './useQueries'

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
  UseMutateAsyncFunction,
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  // Aliases (create* and use* are both supported)
  UseBaseQueryOptions as CreateBaseQueryOptions,
  UseBaseQueryResult as CreateBaseQueryResult,
  UseInfiniteQueryOptions as CreateInfiniteQueryOptions,
  UseInfiniteQueryResult as CreateInfiniteQueryResult,
  UseMutateAsyncFunction as CreateMutateAsyncFunction,
  UseMutateFunction as CreateMutateFunction,
  UseMutationOptions as CreateMutationOptions,
  UseMutationResult as CreateMutationResult,
  UseBaseMutationResult as CreateBaseMutationResult,
  UseQueryOptions as CreateQueryOptions,
  UseQueryResult as CreateQueryResult,
  DefinedUseBaseQueryResult as DefinedCreateBaseQueryResult,
  DefinedUseInfiniteQueryResult as DefinedCreateInfiniteQueryResult,
  DefinedUseQueryResult as DefinedCreateQueryResult,
} from './types'

export { QueryClient } from './QueryClient'
export type {
  QueryObserverOptions,
  DefaultOptions,
  QueryClientConfig,
  InfiniteQueryObserverOptions,
} from './QueryClient'
export { useQuery } from './useQuery'
export const createQuery = useQuery
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  DefinedInitialDataOptionsResult,
  UndefinedInitialDataOptions,
  UndefinedInitialDataOptionsResult,
} from './queryOptions'
export {
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export { useIsFetching } from './useIsFetching'
export { useIsFetching as createIsFetching } from './useIsFetching'
export { useInfiniteQuery }
export const createInfiniteQuery = useInfiniteQuery
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  DefinedInitialDataInfiniteOptionsResult,
  UndefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptionsResult,
} from './infiniteQueryOptions'
export { useMutation } from './useMutation'
export { mutationOptions } from './mutationOptions'
export const createMutation = useMutation
export { useIsMutating } from './useIsMutating'
export { useIsMutating as createIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { useMutationState as createMutationState } from './useMutationState'
export { useQueries } from './useQueries'
export const createQueries = useQueries
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
