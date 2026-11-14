/* istanbul ignore file */

// Re-export core
// oxlint-disable-next-line tanstack-query/no-restricted-syntax
export * from '@tanstack/query-core'

// React Query
export type {
  AnyUseBaseQueryOptions,
  UseBaseQueryOptions,
  UsePrefetchQueryOptions,
  UsePrefetchInfiniteQueryOptions,
  AnyUseQueryOptions,
  UseQueryOptions,
  AnyUseSuspenseQueryOptions,
  UseSuspenseQueryOptions,
  AnyUseInfiniteQueryOptions,
  UseInfiniteQueryOptions,
  AnyUseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryOptions,
  UseBaseQueryResult,
  UseQueryResult,
  UseSuspenseQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryResult,
  DefinedUseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult,
  AnyUseMutationOptions,
  UseMutationOptions,
  UseMutateFunction,
  UseMutateAsyncFunction,
  UseBaseMutationResult,
  UseMutationResult,
} from './types'
export { useQueries } from './useQueries'
export type { QueriesResults, QueriesOptions } from './useQueries'
export { useQuery } from './useQuery'
export { useSuspenseQuery } from './useSuspenseQuery'
export { useSuspenseInfiniteQuery } from './useSuspenseInfiniteQuery'
export { useSuspenseQueries } from './useSuspenseQueries'
export type {
  SuspenseQueriesResults,
  SuspenseQueriesOptions,
} from './useSuspenseQueries'
export { usePrefetchQuery } from './usePrefetchQuery'
export { usePrefetchInfiniteQuery } from './usePrefetchInfiniteQuery'
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from './infiniteQueryOptions'
export {
  QueryClientContext,
  QueryClientProvider,
  useQueryClient,
} from './QueryClientProvider'
export type { QueryClientProviderProps } from './QueryClientProvider'
export type { QueryErrorResetBoundaryProps } from './QueryErrorResetBoundary'
export { HydrationBoundary } from './HydrationBoundary'
export type { HydrationBoundaryProps } from './HydrationBoundary'
export type {
  QueryErrorClearResetFunction,
  QueryErrorIsResetFunction,
  QueryErrorResetBoundaryFunction,
  QueryErrorResetFunction,
} from './QueryErrorResetBoundary'
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating, useMutationState } from './useMutationState'
export { useMutation } from './useMutation'
export { mutationOptions } from './mutationOptions'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useIsRestoring, IsRestoringProvider } from './IsRestoringProvider'
export { useIsHydrating, IsHydratingProvider } from './IsHydratingProvider'
