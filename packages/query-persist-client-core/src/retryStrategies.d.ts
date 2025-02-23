import type { PersistedClient } from './persist'
export type PersistRetryer = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => PersistedClient | undefined
export declare const removeOldestQuery: PersistRetryer
//# sourceMappingURL=retryStrategies.d.ts.map
