import { Subscribable } from './subscribable'
import { isServer } from './utils'

class OnlineManager extends Subscribable {
  private removeHandler?: () => void

  protected onSubscribe(): void {
    if (!this.removeHandler) {
      this.setDefaultHandler()
    }
  }

  setHandler(init: (onOnline: () => void) => () => void): void {
    if (this.removeHandler) {
      this.removeHandler()
    }
    this.removeHandler = init(() => {
      this.onOnline()
    })
  }

  onOnline(): void {
    this.listeners.forEach(listener => {
      listener()
    })
  }

  isOnline(): boolean {
    return navigator.onLine === undefined || navigator.onLine
  }

  private setDefaultHandler() {
    if (!isServer && window?.addEventListener) {
      this.setHandler(onOnline => {
        // Listen to online
        window.addEventListener('online', onOnline, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('online', onOnline)
        }
      })
    }
  }
}

export const onlineManager = new OnlineManager()
