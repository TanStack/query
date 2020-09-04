import { createSetHandler, isServer } from './utils'
import { onVisibilityOrOnlineChange } from './queryCache'

export const setFocusHandler = createSetHandler(() =>
  onVisibilityOrOnlineChange('focus')
)

setFocusHandler(handleFocus => {
  if (isServer || !window?.addEventListener) {
    return
  }

  // Listen to visibillitychange and focus
  window.addEventListener('visibilitychange', handleFocus, false)
  window.addEventListener('focus', handleFocus, false)

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleFocus)
    window.removeEventListener('focus', handleFocus)
  }
})
