import type {
  QueryClient,
  DehydratedState,
  DehydrateOptions,
  HydrateOptions,
} from '@tanstack/query-core'
import { dehydrate, hydrate } from '@tanstack/query-core'
import type { NotifyEventType } from '@tanstack/query-core'

export type Promisable<T> = T | PromiseLike<T>

export interface Persister {
  persistClient(persistClient: PersistedClient): Promisable<void>
  restoreClient(): Promisable<PersistedClient | undefined>
  removeClient(): Promisable<void>
}

export interface PersistedClient {
  timestamp: number
  buster: string
  clientState: DehydratedState
}

export interface PersistQueryClienRootOptions {
  /** The QueryClient to persist */
  queryClient: QueryClient
  /** The Persister interface for storing and restoring the cache
   * to/from a persisted location */
  persister: Persister
  /** A unique string that can be used to forcefully
   * invalidate existing caches if they do not share the same buster string */
  buster?: string
}

export interface PersistedQueryClientRestoreOptions
  extends PersistQueryClienRootOptions {
  /** The max-allowed age of the cache in milliseconds.
   * If a persisted cache is found that is older than this
   * time, it will be discarded */
  maxAge?: number
  /** The options passed to the hydrate function */
  hydrateOptions?: HydrateOptions
}

export interface PersistedQueryClientSaveOptions
  extends PersistQueryClienRootOptions {
  /** The options passed to the dehydrate function */
  dehydrateOptions?: DehydrateOptions
}

export interface PersistQueryClientOptions
  extends PersistedQueryClientRestoreOptions,
    PersistedQueryClientSaveOptions,
    PersistQueryClienRootOptions {}

/**
 * Checks if emitted event is about cache change and not about observers.
 * Useful for persist, where we only want to trigger save when cache is changed.
 */
const cacheableEventTypes: Array<NotifyEventType> = [
  'added',
  'removed',
  'updated',
]

function isCacheableEventType(eventType: NotifyEventType) {
  return cacheableEventTypes.includes(eventType)
}

/**
 * Restores persisted data to the QueryCache
 *  - data obtained from persister.restoreClient
 *  - data is hydrated using hydrateOptions
 * If data is expired, busted, empty, or throws, it runs persister.removeClient
 */
export async function persistQueryClientRestore({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24,
  buster = '',
  hydrateOptions,
}: PersistedQueryClientRestoreOptions) {
  try {
    const persistedClient = await persister.restoreClient()

    if (persistedClient) {
      if (persistedClient.timestamp) {
        const expired = Date.now() - persistedClient.timestamp > maxAge
        const busted = persistedClient.buster !== buster
        if (expired || busted) {
          persister.removeClient()
        } else {
          hydrate(queryClient, persistedClient.clientState, hydrateOptions)
        }
      } else {
        persister.removeClient()
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      queryClient.getLogger().error(err)
      queryClient
        .getLogger()
        .warn(
          'Encountered an error attempting to restore client cache from persisted location. As a precaution, the persisted cache will be discarded.',
        )
    }
    persister.removeClient()
  }
}

/**
 * Persists data from the QueryCache
 *  - data dehydrated using dehydrateOptions
 *  - data is persisted using persister.persistClient
 */
export async function persistQueryClientSave({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions,
}: PersistedQueryClientSaveOptions) {
  const persistClient: PersistedClient = {
    buster,
    timestamp: Date.now(),
    clientState: dehydrate(queryClient, dehydrateOptions),
  }

  await persister.persistClient(persistClient)
}

/**
 * Subscribe to QueryCache and MutationCache updates (for persisting)
 * @returns an unsubscribe function (to discontinue monitoring)
 */
export function persistQueryClientSubscribe(
  props: PersistedQueryClientSaveOptions,
) {
  const unsubscribeQueryCache = props.queryClient
    .getQueryCache()
    .subscribe((event) => {
      if (isCacheableEventType(event.type)) {
        persistQueryClientSave(props)
      }
    })

  const unusbscribeMutationCache = props.queryClient
    .getMutationCache()
    .subscribe((event) => {
      if (isCacheableEventType(event.type)) {
        persistQueryClientSave(props)
      }
    })

  return () => {
    unsubscribeQueryCache()
    unusbscribeMutationCache()
  }
}

/**
 * Restores persisted data to QueryCache and persists further changes.
 */
export function persistQueryClient(
  props: PersistQueryClientOptions,
): [() => void, Promise<void>] {
  let hasUnsubscribed = false
  let persistQueryClientUnsubscribe: (() => void) | undefined
  const unsubscribe = () => {
    hasUnsubscribed = true
    persistQueryClientUnsubscribe?.()
  }

  // Attempt restore
  const restorePromise = persistQueryClientRestore(props).then(() => {
    if (!hasUnsubscribed) {
      // Subscribe to changes in the query cache to trigger the save
      persistQueryClientUnsubscribe = persistQueryClientSubscribe(props)
    }
  })

  return [unsubscribe, restorePromise]
}
