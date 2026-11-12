/* istanbul ignore file */

// Re-export core
export * from '@tanstack/query-core'

// Svelte Query
export type {
  Accessor,
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
  CreateQueryOptions,
  CreateQueryResult,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  DefinedCreateInfiniteQueryResult,
  DefinedCreateBaseQueryResult,
  DefinedCreateQueryResult,
  CreateMutationOptions,
  CreateMutateFunction,
  CreateMutateAsyncFunction,
  CreateBaseMutationResult,
  CreateMutationResult,
  MutationTypeFromResult,
  MutationStateOptions,
  QueryClientProviderProps,
} from './types.js'
export {
  getQueryClientContext,
  setQueryClientContext,
  getIsRestoringContext,
  setIsRestoringContext,
} from './context.js'

export { createQuery } from './createQuery.js'
export type { QueriesResults, QueriesOptions } from './createQueries.svelte.js'
export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js'
export { queryOptions } from './queryOptions.js'
export { createQueries } from './createQueries.svelte.js'
export { createInfiniteQuery } from './createInfiniteQuery.js'
export type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions.js'
export { infiniteQueryOptions } from './infiniteQueryOptions.js'
export { mutationOptions } from './mutationOptions.js'
export { createMutation } from './createMutation.svelte.js'
export { useMutationState } from './useMutationState.svelte.js'
export { useQueryClient } from './useQueryClient.js'
export { useIsFetching } from './useIsFetching.svelte.js'
export { useIsMutating } from './useIsMutating.svelte.js'
export { useIsRestoring } from './useIsRestoring.js'
export { useHydrate } from './useHydrate.js'
export { default as HydrationBoundary } from './HydrationBoundary.svelte'
export { default as QueryClientProvider } from './QueryClientProvider.svelte'
