import { PersistedClient, Persistor } from '../persistQueryClient-experimental'

interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

interface CreateAsyncStoragePersistorOptions {
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

export const createAsyncStoragePersistor = ({
  storage,
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}: CreateAsyncStoragePersistorOptions): Persistor => {
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

function asyncThrottle<Args extends readonly unknown[], Result>(
  func: (...args: Args) => Promise<Result>,
  { interval = 1000, limit = 1 }: { interval?: number; limit?: number } = {}
) {
  if (typeof func !== 'function') throw new Error('argument is not function.')
  const running = { current: false }
  let lastTime = 0
  let timeout: number
  const queue: Array<Args> = []
  return (...args: Args) =>
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
