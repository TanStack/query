import { QueryClient } from '../core'
import { getLogger } from '../core/logger'
import { dehydrate, DehydratedState, hydrate } from '../hydration'
import { Promisable } from 'type-fest'

export interface Persistor {
  persistClient(persistClient: PersistedClient): Promisable<void>
  restoreClient(): Promisable<PersistedClient | undefined>
  removeClient(): Promisable<void>
}

export interface PersistedClient {
  timestamp: number
  buster: string
  clientState: DehydratedState
}

export interface PersistQueryClientOptions {
  /** The QueryClient to persist */
  queryClient: QueryClient
  /** The Persistor interface for storing and restoring the cache
   * to/from a persisted location */
  persistor: Persistor
  /** The max-allowed age of the cache.
   * If a persisted cache is found that is older than this
   * time, it will be discarded */
  maxAge?: number
  /** A unique string that can be used to forcefully
   * invalidate existing caches if they do not share the same buster string */
  buster?: string
}

export async function persistQueryClient({
  queryClient,
  persistor,
  maxAge = 1000 * 60 * 60 * 24,
  buster = '',
}: PersistQueryClientOptions) {
  if (typeof window !== 'undefined') {
    // Subscribe to changes
    const saveClient = () => {
      const persistClient: PersistedClient = {
        buster,
        timestamp: Date.now(),
        clientState: dehydrate(queryClient),
      }

      persistor.persistClient(persistClient)
    }

    // Attempt restore
    try {
      const persistedClient = await persistor.restoreClient()

      if (persistedClient) {
        if (persistedClient.timestamp) {
          const expired = Date.now() - persistedClient.timestamp > maxAge
          const busted = persistedClient.buster !== buster
          if (expired || busted) {
            persistor.removeClient()
          } else {
            hydrate(queryClient, persistedClient.clientState)
          }
        } else {
          persistor.removeClient()
        }
      }
    } catch (err) {
      getLogger().error(err)
      getLogger().warn(
        'Encountered an error attempting to restore client cache from persisted location. As a precaution, the persisted cache will be discarded.'
      )
      persistor.removeClient()
    }

    // Subscribe to changes in the query cache to trigger the save
    queryClient.getQueryCache().subscribe(saveClient)
  }
}
