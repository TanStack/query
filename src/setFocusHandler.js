import { defaultConfigRef, isOnline, isDocumentVisible, Console } from './utils'
import { refetchAllQueries } from './refetchAllQueries'

const onWindowFocus = () => {
  const { refetchAllOnWindowFocus } = defaultConfigRef.current

  if (isDocumentVisible() && isOnline()) {
    refetchAllQueries({
      shouldRefetchQuery: query => {
        if (typeof query.config.refetchOnWindowFocus === 'undefined') {
          return refetchAllOnWindowFocus
        } else {
          return query.config.refetchOnWindowFocus
        }
      },
    }).catch(error => {
      Console.error(error.message)
    })
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
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)

    return () => {
      // Be sure to unsubscribe if a new handler is set
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }
})
