import { createSetHandler, isServer } from './utils'
import { onExternalEvent } from './queryClient'

export const setOnlineHandler = createSetHandler(() =>
  onExternalEvent('online')
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
