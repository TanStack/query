import { isServer, noop } from './utils'

let focusCallback: () => void = noop
let removePreviousHandler: (() => void) | void

export function setFocusHandler(callback: (handler: () => void) => void) {
  if (removePreviousHandler) {
    removePreviousHandler()
  }
  removePreviousHandler = callback(() => {
    focusCallback()
  })
}

export function initFocusHandler(callback: () => void) {
  // Set the callback to execute on focus
  focusCallback = callback

  // Set a default focus handler if needed
  if (!removePreviousHandler)
    setFocusHandler(handleFocus => {
      if (!isServer && window?.addEventListener) {
        // Listen to visibillitychange and focus
        window.addEventListener('visibilitychange', handleFocus, false)
        window.addEventListener('focus', handleFocus, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', handleFocus)
          window.removeEventListener('focus', handleFocus)
        }
      }
    })
}
