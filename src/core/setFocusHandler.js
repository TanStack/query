import { isOnline, isDocumentVisible, Console, isServer } from './utils'
import { queryCaches } from './queryCache'

const visibilityChangeEvent = 'visibilitychange'
const focusEvent = 'focus'

const onWindowFocus = () => {
  if (isDocumentVisible() && isOnline()) {
    queryCaches.forEach(queryCache =>
      queryCache
        .invalidateQueries(query => {
          if (!query.instances.length) {
            return false
          }

          if (!query.instances.some(instance => instance.config.enabled)) {
            return false
          }

          if (!query.state.isStale) {
            return false
          }

          if (query.shouldContinueRetryOnFocus) {
            // delete promise, so refetching will create new one
            delete query.promise
          }

          return query.config.refetchOnWindowFocus
        })
        .catch(Console.error)
    )
  }
}

let removePreviousHandler

export function setFocusHandler(callback) {
  // Unsub the old watcher
  if (removePreviousHandler) {
    removePreviousHandler()
  }
  // Sub the new watcher
  removePreviousHandler = callback(onWindowFocus)
}

setFocusHandler(handleFocus => {
  // Listen to visibillitychange and focus
  if (!isServer && window?.addEventListener) {
    window.addEventListener(visibilityChangeEvent, handleFocus, false)
    window.addEventListener(focusEvent, handleFocus, false)

    return () => {
      // Be sure to unsubscribe if a new handler is set
      window.removeEventListener(visibilityChangeEvent, handleFocus)
      window.removeEventListener(focusEvent, handleFocus)
    }
  }
})
