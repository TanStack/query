import { asyncThrottle } from './asyncThrottle'
import { noop } from './utils'
import type {
  AsyncStorage,
  MaybePromise,
  PersistedClient,
  Persister,
  Promisable,
} from '@tanstack/query-persist-client-core'

/**
 * Called when saving the persisted client fails. Returns, or resolves to, a smaller client to try
 * saving again, or `undefined` to give up.
 */
export type AsyncPersistRetryer = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => Promisable<PersistedClient | undefined>

interface CreateAsyncStoragePersisterOptions {
  /**
   * The storage client used for setting and retrieving items from cache.
   * For SSR pass in `undefined`. Note that window.localStorage can be
   * `null` in Android WebViews depending on how they are configured.
   */
  storage: AsyncStorage<string> | undefined | null
  /** The key to use when storing the cache */
  key?: string
  /**
   * To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk
   */
  throttleTime?: number
  /**
   * How to serialize the data to storage.
   * @default `JSON.stringify`
   */
  serialize?: (client: PersistedClient) => MaybePromise<string>
  /**
   * How to deserialize the data from storage.
   * @default `JSON.parse`
   */
  deserialize?: (cachedString: string) => MaybePromise<PersistedClient>

  retry?: AsyncPersistRetryer
}

/**
 * Creates a persister that saves the client to an asynchronous storage such as `AsyncStorage`,
 * throttled by `throttleTime`. If saving fails, `retry` can return a smaller client to try again.
 * @param options - The `storage` to persist to, the `key`, `throttleTime`, `serialize`,
 * `deserialize`, and `retry` options.
 * @returns A persister that saves, restores, and removes the client in `storage`. Without
 * `storage`, its methods do nothing.
 */
export const createAsyncStoragePersister = ({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  retry,
}: CreateAsyncStoragePersisterOptions): Persister => {
  if (storage) {
    const trySave = async (
      persistedClient: PersistedClient,
    ): Promise<Error | undefined> => {
      try {
        const serialized = await serialize(persistedClient)
        await storage.setItem(key, serialized)
        return
      } catch (error) {
        return error as Error
      }
    }

    return {
      persistClient: asyncThrottle(
        async (persistedClient) => {
          let client: PersistedClient | undefined = persistedClient
          let error = await trySave(client)
          let errorCount = 0
          while (error && client) {
            errorCount++
            client = await retry?.({
              persistedClient: client,
              error,
              errorCount,
            })

            if (client) {
              error = await trySave(client)
            }
          }
        },
        { interval: throttleTime },
      ),
      restoreClient: async () => {
        const cacheString = await storage.getItem(key)

        if (!cacheString) {
          return
        }

        return await deserialize(cacheString)
      },
      removeClient: () => storage.removeItem(key),
    }
  }

  return {
    persistClient: noop,
    restoreClient: () => Promise.resolve(undefined),
    removeClient: noop,
  }
}
