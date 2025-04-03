/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Solid Query
export * from './types'

export type {
  UseQueryOptions,
  UseBaseQueryResult,
  UseQueryResult,
  DefinedUseBaseQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  DefinedUseInfiniteQueryResult,
  UseMutationOptions,
  UseMutateFunction,
  UseMutateAsyncFunction,
  UseBaseMutationResult,
  UseMutationResult,
  UseBaseQueryOptions,
  SolidQueryOptions,
  SolidInfiniteQueryOptions,
  SolidMutationOptions,
} from './types'

// Compatibility types (deprecated)
/**
 * @deprecated Use UseQueryOptions instead
 */
export type { UseQueryOptions as CreateQueryOptions } from './types'
/**
 * @deprecated Use UseBaseQueryResult instead
 */
export type { UseBaseQueryResult as CreateBaseQueryResult } from './types'
/**
 * @deprecated Use UseQueryResult instead
 */
export type { UseQueryResult as CreateQueryResult } from './types'
/**
 * @deprecated Use DefinedUseBaseQueryResult instead
 */
export type { DefinedUseBaseQueryResult as DefinedCreateBaseQueryResult } from './types'
/**
 * @deprecated Use DefinedUseQueryResult instead
 */
export type { DefinedUseQueryResult as DefinedCreateQueryResult } from './types'
/**
 * @deprecated Use UseInfiniteQueryOptions instead
 */
export type { UseInfiniteQueryOptions as CreateInfiniteQueryOptions } from './types'
/**
 * @deprecated Use UseInfiniteQueryResult instead
 */
export type { UseInfiniteQueryResult as CreateInfiniteQueryResult } from './types'
/**
 * @deprecated Use DefinedUseInfiniteQueryResult instead
 */
export type { DefinedUseInfiniteQueryResult as DefinedCreateInfiniteQueryResult } from './types'
/**
 * @deprecated Use UseMutationOptions instead
 */
export type { UseMutationOptions as CreateMutationOptions } from './types'
/**
 * @deprecated Use UseMutateFunction instead
 */
export type { UseMutateFunction as CreateMutateFunction } from './types'
/**
 * @deprecated Use UseMutateAsyncFunction instead
 */
export type { UseMutateAsyncFunction as CreateMutateAsyncFunction } from './types'
/**
 * @deprecated Use UseBaseMutationResult instead
 */
export type { UseBaseMutationResult as CreateBaseMutationResult } from './types'
/**
 * @deprecated Use UseMutationResult instead
 */
export type { UseMutationResult as CreateMutationResult } from './types'
/**
 * @deprecated Use UseBaseQueryOptions instead
 */
export type { UseBaseQueryOptions as CreateBaseQueryOptions } from './types'

export { QueryClient } from './QueryClient'
export type {
  QueryObserverOptions,
  DefaultOptions,
  QueryClientConfig,
  InfiniteQueryObserverOptions,
} from './QueryClient'
export { useQuery } from './useQuery'
/**
 * @deprecated Use useQuery instead
 */
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
/**
 * @deprecated Use useInfiniteQuery instead
 */
export { useInfiniteQuery as createInfiniteQuery } from './useInfiniteQuery'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { useMutation } from './useMutation'
/**
 * @deprecated Use useMutation instead
 */
export { useMutation as createMutation } from './useMutation'
export { useIsMutating } from './useIsMutating'
export { useMutationState } from './useMutationState'
export { useQueries } from './useQueries'
/**
 * @deprecated Use useQueries instead
 */
export { useQueries as createQueries } from './useQueries'
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
