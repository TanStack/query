import { createSetHandler, isServer } from './utils'
import { onVisibilityOrOnlineChange } from './queryCache'

export const setOnlineHandler = createSetHandler(() =>
  onVisibilityOrOnlineChange('online')
)

setOnlineHandler(handleOnline => {
  if (isServer || !window?.addEventListener) {
    return
  }

  // Listen to online
  window.addEventListener('online', handleOnline, false)

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('online', handleOnline)
  }
})
