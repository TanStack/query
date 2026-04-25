export * from '@tanstack/query-core'

export { useQueryClient } from './useQueryClient'
export { VueQueryPlugin } from './vueQueryPlugin'

export { QueryClient } from './queryClient'
export { QueryCache } from './queryCache'
export { queryOptions } from './queryOptions'
export { type QueryOptions } from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { MutationCache } from './mutationCache'
export { mutationOptions } from './mutationOptions'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'
export { usePrefetchQuery } from './usePrefetchQuery'
export { usePrefetchInfiniteQuery } from './usePrefetchInfiniteQuery'
export { useMutation } from './useMutation'
export { useIsFetching } from './useIsFetching'
export { useIsMutating, useMutationState } from './useMutationState'
export { VUE_QUERY_CLIENT } from './utils'

export type { UsePrefetchQueryOptions } from './usePrefetchQuery'
export type { UsePrefetchInfiniteQueryOptions } from './usePrefetchInfiniteQuery'
export type {
  UseQueryOptions,
  UseQueryReturnType,
  UseQueryDefinedReturnType,
  UndefinedInitialQueryOptions,
  DefinedInitialQueryOptions,
} from './useQuery'
export type {
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
} from './useInfiniteQuery'
export type { UseMutationOptions, UseMutationReturnType } from './useMutation'
export type { MutationOptions } from './types'
export type { UseQueriesOptions, UseQueriesResults } from './useQueries'
export type { MutationFilters, MutationStateOptions } from './useMutationState'
export type { QueryFilters } from './useIsFetching'
export type { VueQueryPluginOptions } from './vueQueryPlugin'
