// The public surface this package re-exports, next to `@tanstack/query-core`.
export {
  getQueryClient,
  isRestoring,
  setIsRestoring,
  setQueryClient,
  setQueryClientFactory,
} from './client.js'
export type { QueryGlobal } from './client.js'
export {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from './options.js'
export type {
  DefinedInitialDataInfiniteOptions,
  DefinedInitialDataOptions,
  UndefinedInitialDataInfiniteOptions,
  UndefinedInitialDataOptions,
  UnusedSkipTokenInfiniteOptions,
  UnusedSkipTokenOptions,
} from './options.js'
export type {
  CreateQueriesOptions,
  CreateQueriesResult,
  QueriesOptions,
  QueriesResults,
} from './queries-types.js'
export type * from './types.js'
