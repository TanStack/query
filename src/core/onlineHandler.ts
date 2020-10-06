import { isServer, noop } from './utils'

let onlineCallback: () => void = noop
let removePreviousHandler: (() => void) | void

export function setOnlineHandler(callback: (handler: () => void) => void) {
  if (removePreviousHandler) {
    removePreviousHandler()
  }
  removePreviousHandler = callback(() => {
    onlineCallback()
  })
}

export function initOnlineHandler(callback: () => void) {
  // Set the callback to execute on online
  onlineCallback = callback

  // Set a default focus handler if needed
  if (!removePreviousHandler) {
    setOnlineHandler(handleOnline => {
      if (!isServer && window?.addEventListener) {
        // Listen to online
        window.addEventListener('online', handleOnline, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('online', handleOnline)
        }
      }
    })
  }
}
