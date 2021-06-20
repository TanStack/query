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
  throttleTime = 1000,
}: CreateAsyncStoragePersistorOptions) => {
  return {
    persistClient: asyncThrottle(
      persistedClient => storage.setItem(key, JSON.stringify(persistedClient)),
      { interval: throttleTime }
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

function asyncThrottle<T>(
  func: (...args: ReadonlyArray<unknown>) => Promise<T>,
  { interval = 1000, limit = 1 }: { interval?: number; limit?: number } = {}
) {
  if (typeof func !== 'function') throw new Error('argument is not function.')
  const running = { current: false }
  let lastTime = 0
  let timeout: number
  const queue: Array<any[]> = []
  return (...args: any) =>
    (async () => {
      if (running.current) {
        lastTime = Date.now()
        if (queue.length > limit) {
          queue.shift()
        }

        queue.push(args)
        clearTimeout(timeout)
      }
      if (Date.now() - lastTime > interval) {
        running.current = true
        await func(...args)
        lastTime = Date.now()
        running.current = false
      } else {
        if (queue.length > 0) {
          const lastArgs = queue[queue.length - 1]!
          timeout = setTimeout(async () => {
            if (!running.current) {
              running.current = true
              await func(...lastArgs)
              running.current = false
            }
          }, interval)
        }
      }
    })()
}
