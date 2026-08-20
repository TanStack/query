/* istanbul ignore file */

export * from '@tanstack/query-core'

export type { Accessor, ValueAccessor } from './accessor.js'

export {
  getDefaultQueryClient,
  queryClientContext,
  registerDefaultQueryClient,
  resolveQueryClient,
  unregisterDefaultQueryClient,
  useQueryClient,
} from './context.js'

export { QueryClientProvider } from './QueryClientProvider.js'

export type {
  CreateInfiniteQueryOptions,
  InfiniteQueryResultAccessor,
} from './createInfiniteQueryController.js'
export { createInfiniteQueryController } from './createInfiniteQueryController.js'

export type {
  CreateMutationOptions,
  MutationResultAccessor,
} from './createMutationController.js'
export { createMutationController } from './createMutationController.js'

export type {
  CreateQueriesControllerOptions,
  CreateQueriesInput,
  QueriesResultAccessor,
} from './createQueriesController.js'
export { createQueriesController } from './createQueriesController.js'

export type {
  CreateQueryOptions,
  QueryResultAccessor,
} from './createQueryController.js'
export { createQueryController } from './createQueryController.js'

export type { IsFetchingAccessor } from './useIsFetching.js'
export { useIsFetching } from './useIsFetching.js'

export type { IsMutatingAccessor } from './useIsMutating.js'
export { useIsMutating } from './useIsMutating.js'

export type {
  MutationStateAccessor,
  MutationStateOptions,
} from './useMutationState.js'
export { useMutationState } from './useMutationState.js'

export type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from './queryOptions.js'
export { queryOptions } from './queryOptions.js'

export { infiniteQueryOptions } from './infiniteQueryOptions.js'
export { mutationOptions } from './mutationOptions.js'

export type {
  InfiniteQueryControllerOptions,
  MutationControllerOptions,
  MutationControllerResult,
  QueriesControllerOptions,
  QueryControllerOptions,
  QueryControllerResult,
} from './types.js'
