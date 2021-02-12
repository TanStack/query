import { noop } from '../core/utils'
import { PersistedClient, Persistor } from '../persistQueryClient-experimental'

interface CreateLocalStoragePersistorOptions {
  /** The key to use when storing the cache to localstorage */
  localStorageKey?: string
  /** To avoid localstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}

export function createLocalStoragePersistor({
  localStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
}: CreateLocalStoragePersistorOptions = {}): Persistor {
  if (typeof localStorage !== 'undefined') {
    return {
      persistClient: throttle(persistedClient => {
        localStorage.setItem(localStorageKey, JSON.stringify(persistedClient))
      }, throttleTime),
      restoreClient: () => {
        const cacheString = localStorage.getItem(localStorageKey)

        if (!cacheString) {
          return
        }

        return JSON.parse(cacheString) as PersistedClient
      },
      removeClient: () => {
        localStorage.removeItem(localStorageKey)
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
