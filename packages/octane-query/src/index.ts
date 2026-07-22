// @tanstack/octane-query — TanStack Query for the Octane renderer.
//
// Reuses @tanstack/query-core verbatim (QueryClient, observers, caches — all
// framework-agnostic) and reimplements the React binding on octane's hooks. The
// public surface matches @tanstack/react-query, so most query code works by
// changing the import.
export * from '@tanstack/query-core'

export { useQuery } from './useQuery'
export { useMutation } from './useMutation'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useSuspenseQuery, useSuspenseInfiniteQuery } from './useSuspenseQuery'
export { useSuspenseQueries } from './useSuspenseQueries'
export { usePrefetchQuery, usePrefetchInfiniteQuery } from './usePrefetch'
export { useQueries } from './useQueries'
export { queryOptions } from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export { mutationOptions } from './mutationOptions'
export { useIsFetching } from './useIsFetching'
export { useMutationState, useIsMutating } from './useMutationState'
export { useQueryClient, QueryClientContext } from './context'
export { QueryClientProvider } from './QueryClientProvider.tsrx'
export { HydrationBoundary } from './HydrationBoundary.tsrx'
export { IsRestoringProvider, useIsRestoring } from './isRestoring'
export { QueryErrorResetBoundary } from './QueryErrorResetBoundary.tsrx'
export { useQueryErrorResetBoundary } from './errorResetBoundary'

// The binding-level type surface (1:1 with @tanstack/react-query's exports).
export type {
  AnyUseBaseQueryOptions,
  UseBaseQueryOptions,
  UsePrefetchQueryOptions,
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
  QueryClientProviderProps,
  HydrationBoundaryProps,
  QueryErrorResetFunction,
  QueryErrorIsResetFunction,
  QueryErrorClearResetFunction,
  QueryErrorResetBoundaryValue,
  QueryErrorResetBoundaryFunction,
  QueryErrorResetBoundaryProps,
} from './types'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from './queryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from './infiniteQueryOptions'
export type { QueriesOptions, QueriesResults } from './queries-types'
export type {
  SuspenseQueriesOptions,
  SuspenseQueriesResults,
} from './suspense-queries-types'
