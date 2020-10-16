import { isServer } from './utils'

type FocusListener = () => void

class FocusManager {
  private listeners: FocusListener[]
  private removeHandler?: () => void

  constructor() {
    this.listeners = []
  }

  subscribe(listener: FocusListener): () => void {
    if (!this.removeHandler) {
      this.setDefaultHandler()
    }

    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter(x => x === listener)
    }
  }

  setHandler(init: (onFocus: () => void) => () => void): void {
    if (this.removeHandler) {
      this.removeHandler()
    }
    this.removeHandler = init(() => {
      this.onFocus()
    })
  }

  onFocus(): void {
    this.listeners.forEach(listener => {
      listener()
    })
  }

  isFocused(): boolean {
    // document global can be unavailable in react native
    if (typeof document === 'undefined') {
      return true
    }

    return [undefined, 'visible', 'prerender'].includes(
      document.visibilityState
    )
  }

  private setDefaultHandler() {
    if (!isServer && window?.addEventListener) {
      this.setHandler(onFocus => {
        // Listen to visibillitychange and focus
        window.addEventListener('visibilitychange', onFocus, false)
        window.addEventListener('focus', onFocus, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', onFocus)
          window.removeEventListener('focus', onFocus)
        }
      })
    }
  }
}

export const focusManager = new FocusManager()
