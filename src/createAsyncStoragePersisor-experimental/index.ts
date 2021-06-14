import AsyncStorage from '@react-native-community/async-storage'

interface CreateAsyncStoragePersistorOptions {
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
}

export const asyncStoragePersistor = ({
  key,
  throttleTime,
}: CreateAsyncStoragePersistorOptions) => {
  return {
    persistClient: throttle(function (persistedClient) {
      AsyncStorage.setItem(key, JSON.stringify(persistedClient))
    }, throttleTime),
    restoreClient: async function restoreClient() {
      const cacheString = await AsyncStorage.getItem(key)

      if (!cacheString) {
        return
      }

      return JSON.parse(cacheString)
    },
    removeClient: function removeClient() {
      AsyncStorage.removeItem(key)
    },
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
