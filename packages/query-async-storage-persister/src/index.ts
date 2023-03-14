import type {
  PersistedClient,
  Persister,
  Promisable,
} from '@tanstack/query-persist-client-core'
import { asyncThrottle } from './asyncThrottle'

interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<unknown>
  removeItem: (key: string) => Promise<void>
}

export type AsyncPersistRetryer = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => Promisable<PersistedClient | undefined>

interface CreateAsyncStoragePersisterOptions {
  /** The storage client used for setting and retrieving items from cache.
   * For SSR pass in `undefined`. Note that window.localStorage can be
   * `null` in Android WebViews depending on how they are configured.
   */
  storage: AsyncStorage | undefined | null
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
  /**
   * How to serialize the data to storage.
   * @default `JSON.stringify`
   */
  serialize?: (client: PersistedClient) => string
  /**
   * How to deserialize the data from storage.
   * @default `JSON.parse`
   */
  deserialize?: (cachedString: string) => PersistedClient

  retry?: AsyncPersistRetryer
}

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
        await storage.setItem(key, serialize(persistedClient))
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

        return deserialize(cacheString) as PersistedClient
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
