import { isOnline, isDocumentVisible, Console, isServer } from './utils'
import { defaultConfigRef } from './config'
import { queryCache } from './queryCache'

const visibilityChangeEvent = 'visibilitychange'
const focusEvent = 'focus'

const onWindowFocus = () => {
  const { refetchAllOnWindowFocus } = defaultConfigRef.current

  if (isDocumentVisible() && isOnline()) {
    queryCache
      .refetchQueries(query => {
        if (typeof query.config.refetchOnWindowFocus === 'undefined') {
          return refetchAllOnWindowFocus
        } else {
          return query.config.refetchOnWindowFocus
        }
      })
      .catch(Console.error)
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
