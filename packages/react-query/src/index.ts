/* istanbul ignore file */

// Re-export core
export { CancelledError } from '@tanstack/query-core'
export { QueryCache } from '@tanstack/query-core'
export type { QueryCacheNotifyEvent } from '@tanstack/query-core'
export { QueryClient } from '@tanstack/query-core'
export { QueryObserver } from '@tanstack/query-core'
export { QueriesObserver } from '@tanstack/query-core'
export { InfiniteQueryObserver } from '@tanstack/query-core'
export { MutationCache } from '@tanstack/query-core'
export { MutationObserver } from '@tanstack/query-core'
export { notifyManager } from '@tanstack/query-core'
export { focusManager } from '@tanstack/query-core'
export { onlineManager } from '@tanstack/query-core'
export {
  hashKey,
  replaceEqualDeep,
  isServer,
  matchQuery,
  keepPreviousData,
} from '@tanstack/query-core'
export type {
  MutationFilters,
  QueryFilters,
  Updater,
} from '@tanstack/query-core'
export { isCancelledError } from '@tanstack/query-core'
export {
  dehydrate,
  hydrate,
  defaultShouldDehydrateQuery,
  defaultShouldDehydrateMutation,
} from '@tanstack/query-core'

// Types
export type * from './types'
export type { QueryState } from '@tanstack/query-core'
export { Query } from '@tanstack/query-core'
export type { Mutation, MutationState } from '@tanstack/query-core'
export type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
} from '@tanstack/query-core'
export type { QueriesObserverOptions } from '@tanstack/query-core'

// React Query
export type * from './types'

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
export { queryOptions } from './queryOptions'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
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
export {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from './QueryErrorResetBoundary'
export { useIsFetching } from './useIsFetching'
export { useIsMutating, useMutationState } from './useMutationState'
export { useMutation } from './useMutation'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useIsRestoring, IsRestoringProvider } from './isRestoring'
