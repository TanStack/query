/* istanbul ignore file */

import { useQuery } from './useQuery'
import { useInfiniteQuery } from './useInfiniteQuery'
import { useMutation } from './useMutation'
import { useQueries } from './useQueries'

import type {
  DefinedUseBaseQueryResult,
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
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
} from './types'

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
} from './types'

// Compatibility types (deprecated)
/** @deprecated Use UseQueryOptions instead */
export type CreateQueryOptions = UseQueryOptions
/** @deprecated Use UseBaseQueryResult instead */
export type CreateBaseQueryResult = UseBaseQueryResult
/** @deprecated Use UseQueryResult instead */
export type CreateQueryResult = UseQueryResult
/** @deprecated Use DefinedUseBaseQueryResult instead */
export type DefinedCreateBaseQueryResult = DefinedUseBaseQueryResult
/** @deprecated Use DefinedUseQueryResult instead */
export type DefinedCreateQueryResult = DefinedUseQueryResult
/** @deprecated Use UseInfiniteQueryOptions instead */
export type CreateInfiniteQueryOptions = UseInfiniteQueryOptions
/** @deprecated Use UseInfiniteQueryResult instead */
export type CreateInfiniteQueryResult = UseInfiniteQueryResult
/** @deprecated Use DefinedUseInfiniteQueryResult instead */
export type DefinedCreateInfiniteQueryResult = DefinedUseInfiniteQueryResult
/** @deprecated Use UseMutationOptions instead */
export type CreateMutationOptions = UseMutationOptions
/** @deprecated Use UseMutateFunction instead */
export type CreateMutateFunction = UseMutateFunction
/** @deprecated Use UseMutateAsyncFunction instead */
export type CreateMutateAsyncFunction = UseMutateAsyncFunction
/** @deprecated Use UseBaseMutationResult instead */
export type CreateBaseMutationResult = UseBaseMutationResult
/** @deprecated Use UseMutationResult instead */
export type CreateMutationResult = UseMutationResult
/** @deprecated Use UseBaseQueryOptions instead */
export type CreateBaseQueryOptions = UseBaseQueryOptions

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
