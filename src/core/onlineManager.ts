import { Subscribable } from './subscribable'
import { isServer } from './utils'

class OnlineManager extends Subscribable {
  private online?: boolean
  private removeEventListener?: () => void

  protected onSubscribe(): void {
    if (!this.removeEventListener) {
      this.setDefaultEventListener()
    }
  }

  setEventListener(setup: (onOnline: () => void) => () => void): void {
    if (this.removeEventListener) {
      this.removeEventListener()
    }
    this.removeEventListener = setup(() => {
      this.onOnline()
    })
  }

  onOnline(): void {
    this.listeners.forEach(listener => {
      listener()
    })
  }

  setOnline(online: boolean | undefined): void {
    this.online = online

    if (online) {
      this.onOnline()
    }
  }

  isOnline(): boolean {
    if (typeof this.online === 'boolean') {
      return this.online
    }

    return navigator.onLine === undefined || navigator.onLine
  }

  private setDefaultEventListener() {
    if (!isServer && window?.addEventListener) {
      this.setEventListener(onOnline => {
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
