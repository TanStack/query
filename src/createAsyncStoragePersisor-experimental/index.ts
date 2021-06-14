import AsyncStorage from '@react-native-community/async-storage'

export const asyncStoragePersistor = ({ asyncStorageKey, throttleTime }) => {
  return {
    persistClient: throttle(function (persistedClient) {
      AsyncStorage.setItem(asyncStorageKey, JSON.stringify(persistedClient))
    }, throttleTime),
    restoreClient: async function restoreClient() {
      const cacheString = await AsyncStorage.getItem(asyncStorageKey)

      if (!cacheString) {
        return
      }

      return JSON.parse(cacheString)
    },
    removeClient: function removeClient() {
      AsyncStorage.removeItem(asyncStorageKey)
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
