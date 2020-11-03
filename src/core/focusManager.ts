import { Subscribable } from './subscribable'
import { isServer } from './utils'

class FocusManager extends Subscribable {
  private focused?: boolean
  private removeEventListener?: () => void

  protected onSubscribe(): void {
    if (!this.removeEventListener) {
      this.setDefaultEventListener()
    }
  }

  setEventListener(
    setup: (onFocus: () => void) => (focused?: boolean) => void
  ): void {
    if (this.removeEventListener) {
      this.removeEventListener()
    }
    this.removeEventListener = setup((focused?: boolean) => {
      if (typeof focused === 'boolean') {
        this.setFocused(focused)
      } else {
        this.onFocus()
      }
    })
  }

  setFocused(focused?: boolean): void {
    this.focused = focused

    if (focused) {
      this.onFocus()
    }
  }

  onFocus(): void {
    this.listeners.forEach(listener => {
      listener()
    })
  }

  isFocused(): boolean {
    if (typeof this.focused === 'boolean') {
      return this.focused
    }

    // document global can be unavailable in react native
    if (typeof document === 'undefined') {
      return true
    }

    return [undefined, 'visible', 'prerender'].includes(
      document.visibilityState
    )
  }

  private setDefaultEventListener() {
    if (!isServer && window?.addEventListener) {
      this.setEventListener(onFocus => {
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
