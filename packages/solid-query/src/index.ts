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

// Compatibility types
export type {
  UseQueryOptions as CreateQueryOptions,
  UseBaseQueryResult as CreateBaseQueryResult,
  UseQueryResult as CreateQueryResult,
  DefinedUseBaseQueryResult as DefinedCreateBaseQueryResult,
  DefinedUseQueryResult as DefinedCreateQueryResult,
  UseInfiniteQueryOptions as CreateInfiniteQueryOptions,
  UseInfiniteQueryResult as CreateInfiniteQueryResult,
  DefinedUseInfiniteQueryResult as DefinedCreateInfiniteQueryResult,
  UseMutationOptions as CreateMutationOptions,
  UseMutateFunction as CreateMutateFunction,
  UseMutateAsyncFunction as CreateMutateAsyncFunction,
  UseBaseMutationResult as CreateBaseMutationResult,
  UseMutationResult as CreateMutationResult,
  UseBaseQueryOptions as CreateBaseQueryOptions,
} from './types'

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
