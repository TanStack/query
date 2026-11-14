/* istanbul ignore file */

export {
  persistQueryClientRestore,
  persistQueryClientSave,
  persistQueryClientSubscribe,
  persistQueryClient,
} from './persist'
export type {
  Promisable,
  Persister,
  PersistedClient,
  PersistQueryClientRootOptions,
  PersistedQueryClientRestoreOptions,
  PersistedQueryClientSaveOptions,
  PersistQueryClientOptions,
} from './persist'
export { removeOldestQuery } from './retryStrategies'
export type { PersistRetryer } from './retryStrategies'
export {
  experimental_createQueryPersister,
  PERSISTER_KEY_PREFIX,
} from './createPersister'
export type {
  PersistedQuery,
  MaybePromise,
  AsyncStorage,
  StoragePersisterOptions,
} from './createPersister'
