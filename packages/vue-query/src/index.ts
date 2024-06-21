export * from '@tanstack/query-core'

export { useQueryClient } from './useQueryClient'
export { VueQueryPlugin } from './vueQueryPlugin'

export { QueryClient } from './queryClient'
export { QueryCache } from './queryCache'
export { queryOptions } from './queryOptions'
export { infiniteQueryOptions } from './infiniteQueryOptions'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
export { MutationCache } from './mutationCache'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useMutation } from './useMutation'
export { useIsFetching } from './useIsFetching'
export { useIsMutating, useMutationState } from './useMutationState'
export { VUE_QUERY_CLIENT } from './utils'

export type {
  UseQueryOptions,
  UseQueryReturnType,
  UseQueryDefinedReturnType,
} from './useQuery'
export type {
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
} from './useInfiniteQuery'
export type { UseMutationOptions, UseMutationReturnType } from './useMutation'
export type { UseQueriesOptions, UseQueriesResults } from './useQueries'
export type { MutationFilters, MutationStateOptions } from './useMutationState'
export type { QueryFilters } from './useIsFetching'
export type { VueQueryPluginOptions } from './vueQueryPlugin'
