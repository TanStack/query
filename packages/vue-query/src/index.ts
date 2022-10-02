/* istanbul ignore file */

export * from '@tanstack/query-core'

export { useQueryClient } from './useQueryClient'
export { VueQueryPlugin } from './vueQueryPlugin'

export { QueryClient } from './queryClient'
export { QueryCache } from './queryCache'
export { MutationCache } from './mutationCache'
export { useQuery } from './useQuery'
export { useQueries } from './useQueries'
export { useInfiniteQuery } from './useInfiniteQuery'
export { useMutation } from './useMutation'
export { useIsFetching } from './useIsFetching'
export { useIsMutating } from './useIsMutating'
export { VUE_QUERY_CLIENT } from './utils'

export type { UseQueryReturnType } from './useBaseQuery'
export type { UseQueryOptions } from './useQuery'
export type { UseInfiniteQueryOptions } from './useInfiniteQuery'
export type { UseMutationOptions, UseMutationReturnType } from './useMutation'
export type { UseQueriesOptions, UseQueriesResults } from './useQueries'
export type { MutationFilters } from './useIsMutating'
export type { QueryFilters } from './useIsFetching'
export type { VueQueryPluginOptions } from './vueQueryPlugin'
