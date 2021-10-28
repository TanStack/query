import { noop } from '../core/utils'
import { PersistedClient, Persistor } from '../persistQueryClient-experimental'

interface CreateWebStoragePersistorOptions {
  /** The storage client used for setting an retrieving items from cache */
  storage: Storage
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}

export function createWebStoragePersistor({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}: CreateWebStoragePersistorOptions): Persistor {
  //try to save data to storage
  function trySave(persistedClient: PersistedClient) {
    try {
      storage.setItem(key, JSON.stringify(persistedClient))
    } catch {
      return false
    }
    return true
  }

  if (typeof storage !== 'undefined') {
    return {
      persistClient: throttle(persistedClient => {
        if (trySave(persistedClient) !== true) {
          const { mutations, queries } = persistedClient.clientState

          // try to remove mutations and save
          while (mutations.length > 0) {
            mutations.unshift()
            persistedClient.clientState.mutations = mutations
            if (trySave(persistedClient)) {
              return
            }
          }

          // clean old queries and try save
          const sortedQueries = queries.sort(
            (a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt
          )
          while (sortedQueries.length > 0) {
            const oldestData = sortedQueries.shift()
            persistedClient.clientState.queries = queries.filter(
              q => q !== oldestData
            )
            if (trySave(persistedClient)) {
              return
            }
          }
        }
      }, throttleTime),
      restoreClient: () => {
        const cacheString = storage.getItem(key)

        if (!cacheString) {
          return
        }

        return JSON.parse(cacheString) as PersistedClient
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
  let timer: number | null = null
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
