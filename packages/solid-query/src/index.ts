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
  SolidInfiniteQueryOptions,
  SolidMutationOptions,
  SolidQueryOptions,
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
  // Compatibility types (deprecated)
  /** @deprecated Use UseBaseQueryOptions instead */
  UseBaseQueryOptions as CreateBaseQueryOptions,
  /** @deprecated Use UseBaseQueryResult instead */
  UseBaseQueryResult as CreateBaseQueryResult,
  /** @deprecated Use UseInfiniteQueryOptions instead */
  UseInfiniteQueryOptions as CreateInfiniteQueryOptions,
  /** @deprecated Use UseInfiniteQueryResult instead */
  UseInfiniteQueryResult as CreateInfiniteQueryResult,
  /** @deprecated Use UseMutateAsyncFunction instead */
  UseMutateAsyncFunction as CreateMutateAsyncFunction,
  /** @deprecated Use UseMutateFunction instead */
  UseMutateFunction as CreateMutateFunction,
  /** @deprecated Use UseMutationOptions instead */
  UseMutationOptions as CreateMutationOptions,
  /** @deprecated Use UseMutationResult instead */
  UseMutationResult as CreateMutationResult,
  /** @deprecated Use UseBaseMutationResult instead */
  UseBaseMutationResult as CreateBaseMutationResult,
  /** @deprecated Use UseQueryOptions instead */
  UseQueryOptions as CreateQueryOptions,
  /** @deprecated Use UseQueryResult instead */
  UseQueryResult as CreateQueryResult,
  /** @deprecated Use DefinedUseBaseQueryResult instead */
  DefinedUseBaseQueryResult as DefinedCreateBaseQueryResult,
  /** @deprecated Use DefinedUseInfiniteQueryResult instead */
  DefinedUseInfiniteQueryResult as DefinedCreateInfiniteQueryResult,
  /** @deprecated Use DefinedUseQueryResult instead */
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
/** @deprecated Use useQuery instead */
export const createQuery = useQuery
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
export { useInfiniteQuery }
/** @deprecated Use useInfiniteQuery instead */
export const createInfiniteQuery = useInfiniteQuery
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { useMutation } from './useMutation'
/** @deprecated Use useMutation instead */
export const createMutation = useMutation
export { useIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { useQueries } from './useQueries'
/** @deprecated Use useQueries instead */
export const createQueries = useQueries
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
