import { PersistedClient, Persister } from '../persistQueryClient'
import { asyncThrottle } from './asyncThrottle'

interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

interface CreateAsyncStoragePersisterOptions {
  /** The storage client used for setting an retrieving items from cache */
  storage: AsyncStorage
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
}

export const createAsyncStoragePersister = ({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: CreateAsyncStoragePersisterOptions): Persister => {
  return {
    persistClient: asyncThrottle(
      persistedClient => storage.setItem(key, serialize(persistedClient)),
      { interval: throttleTime }
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
