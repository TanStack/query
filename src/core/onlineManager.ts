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

  setEventListener(
    setup: (setOnline: (online?: boolean) => void) => () => void
  ): void {
    if (this.removeEventListener) {
      this.removeEventListener()
    }
    this.removeEventListener = setup((online?: boolean) => {
      if (typeof online === 'boolean') {
        this.setOnline(online)
      } else {
        this.onOnline()
      }
    })
  }

  setOnline(online?: boolean): void {
    this.online = online

    if (online) {
      this.onOnline()
    }
  }

  onOnline(): void {
    this.listeners.forEach(listener => {
      listener()
    })
  }

  isOnline(): boolean {
    if (typeof this.online === 'boolean') {
      return this.online
    }

    if (
      typeof navigator === 'undefined' ||
      typeof navigator.onLine === 'undefined'
    ) {
      return true
    }

    return navigator.onLine
  }

  private setDefaultEventListener() {
    if (!isServer && window?.addEventListener) {
      this.setEventListener(onOnline => {
        const listener = () => onOnline()
        // Listen to online
        window.addEventListener('online', listener, false)
        window.addEventListener('offline', listener, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('online', listener)
          window.removeEventListener('offline', listener)
        }
      })
    }
  }
}

export const onlineManager = new OnlineManager()
