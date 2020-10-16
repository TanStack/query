import { isServer } from './utils'

type OnlineListener = () => void

class OnlineManager {
  private listeners: OnlineListener[]
  private removeHandler?: () => void

  constructor() {
    this.listeners = []
  }

  subscribe(listener: OnlineListener): () => void {
    if (!this.removeHandler) {
      this.setDefaultHandler()
    }

    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter(x => x === listener)
    }
  }

  setOnlineHandler(init: (onOnline: () => void) => () => void): void {
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
      this.setOnlineHandler(onOnline => {
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
