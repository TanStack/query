import type { PersistQueryClientOptions as PersistQueryClientOptionsCore } from '@tanstack/query-persist-client-core'

/**
 * Configures cache persistence and callbacks for completion of the initial restoration.
 */
export type PersistQueryClientUserOptions = {
  /**
   * Persistence storage and lifecycle settings; the client is supplied by the Query provider.
   */
  persistOptions: Omit<PersistQueryClientOptionsCore, 'queryClient'>
  /** Called after restoration succeeds. A returned promise is awaited. */
  onSuccess?: () => unknown
  /** Called if restoration fails. A returned promise is awaited. */
  onError?: () => unknown
}

/**
 * Returns persistence options. The function runs once in an Angular injection
 * context in the browser, so it can call `inject()` and touch browser APIs.
 */
export type WithPersistQueryClientFn = () => PersistQueryClientUserOptions
