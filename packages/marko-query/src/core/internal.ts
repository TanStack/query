// Plumbing for this package's tags and components. Not public API.
export {
  CacheWatcher,
  MutationBinding,
  QueriesBinding,
  QueryBinding,
  hydrateBoundary,
  readIsFetching,
  readIsMutating,
  idleMutationResult,
  readMutationState,
  readQueries,
  readQuery,
  toPlainQueries,
  toPlainResult,
  watchIsFetching,
  watchIsMutating,
  watchMutationState,
} from './bindings.js'
export type {
  QueriesInput,
  QueriesListener,
  QueriesValue,
  QueryListener,
  Snapshot,
  Thrown,
} from './bindings.js'
export {
  DEHYDRATED_STATE_KEY,
  acquireClient,
  holdClient,
  onPageClientChange,
  onRestoringChange,
  registerQueryClientFactory,
  resolveClient,
} from './client.js'
export type { ClientHold } from './client.js'
