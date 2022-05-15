import { noop } from '../core/utils'
import {
  PersistedClient,
  Persister,
  PersistErrorHandler,
} from '../persistQueryClient'

interface CreateWebStoragePersisterOptions {
  /** The storage client used for setting and retrieving items from cache */
  storage: Storage | undefined
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

  handlePersistError?: PersistErrorHandler
}

export function createWebStoragePersister({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  handlePersistError,
}: CreateWebStoragePersisterOptions): Persister {
  if (typeof storage !== 'undefined') {
    const trySave = (persistedClient: PersistedClient): Error | undefined => {
      try {
        storage.setItem(key, serialize(persistedClient))
      } catch (error) {
        return error as Error
      }
    }
    return {
      persistClient: throttle(persistedClient => {
        let client: PersistedClient | undefined = persistedClient
        let error = trySave(client)
        let errorCount = 0
        while (error && client) {
          errorCount++
          client = handlePersistError?.({
            persistedClient: client,
            error,
            errorCount,
          })

          if (client) {
            error = trySave(client)
          }
        }
      }, throttleTime),
      restoreClient: () => {
        const cacheString = storage.getItem(key)

        if (!cacheString) {
          return
        }

        return deserialize(cacheString) as PersistedClient
      },
      removeClient: () => {
        storage.removeItem(key)
      },
    }
  }

  return {
    persistClient: noop,
    restoreClient: noop,
    removeClient: noop,
  }
}

function throttle<TArgs extends any[]>(
  func: (...args: TArgs) => any,
  wait = 100
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let params: TArgs
  return function (...args: TArgs) {
    params = args
    if (timer === null) {
      timer = setTimeout(() => {
        func(...params)
        timer = null
      }, wait)
    }
  }
}
