import AsyncStorage from '@react-native-community/async-storage'

function throttle(func, wait) {
  if (wait === 0) {
    wait = 100
  }

  var timer = null
  return function () {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key]
    }

    if (timer === null) {
      timer = setTimeout(function () {
        func.apply(0, args)
        timer = null
      }, wait)
    }
  }
}

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
