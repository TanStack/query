import { noop } from '../core/utils'
import { PersistedClient, Persistor } from '../persistQueryClient-experimental'

interface CreateSessionStoragePersistorOptions {
  /** The key to use when storing the cache to sessionstorage */
  sessionStorageKey?: string
  /** To avoid sessionstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}

export function createSessionStoragePersistor({
  sessionStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}: CreateSessionStoragePersistorOptions = {}): Persistor {
  if (typeof sessionStorage !== 'undefined') {
    return {
      persistClient: throttle(persistedClient => {
        sessionStorage.setItem(sessionStorageKey, JSON.stringify(persistedClient))
      }, throttleTime),
      restoreClient: () => {
        const cacheString = sessionStorage.getItem(sessionStorageKey)

        if (!cacheString) {
          return
        }

        return JSON.parse(cacheString) as PersistedClient
      },
      removeClient: () => {
        sessionStorage.removeItem(sessionStorageKey)
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

  return function (...args: TArgs) {
    if (timer === null) {
      timer = setTimeout(() => {
        func(...args)
        timer = null
      }, wait)
    }
  }
}
