interface AsyncStorage {
  getItem: (key: string) => Promise<string>
  setItem: (key: string, value: string) => Promise<unknown>
  removeItem: (key: string) => Promise<unknown>
}

interface CreateAsyncStoragePersistorOptions {
  /** The storage client used for setting an retrieving items from cache */
  storage: AsyncStorage
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}

export const asyncStoragePersistor = ({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime,
}: CreateAsyncStoragePersistorOptions) => {
  return {
    persistClient: throttle(
      persistedClient => storage.setItem(key, JSON.stringify(persistedClient)),
      throttleTime
    ),
    restoreClient: async () => {
      const cacheString = await storage.getItem(key)

      if (!cacheString) {
        return
      }

      return JSON.parse(cacheString)
    },
    removeClient: () => storage.removeItem(key),
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
