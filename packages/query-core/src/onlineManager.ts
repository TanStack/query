import { Subscribable } from './subscribable'
import { isServer } from './utils'

type SetupFn = (
  setOnline: (online?: boolean) => void,
) => (() => void) | undefined

export class OnlineManager extends Subscribable {
  private online?: boolean
  private cleanup?: () => void

  private setup: SetupFn

  constructor() {
    super()
    this.setup = (onOnline) => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isServer && window.addEventListener) {
        const listener = () => onOnline()
        // Listen to online
        window.addEventListener('online', listener, false)
        window.addEventListener('offline', listener, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('online', listener)
          window.removeEventListener('offline', listener)
        }
      }

      return
    }
  }

  protected onSubscribe(): void {
    if (!this.cleanup) {
      this.setEventListener(this.setup)
    }
  }

  protected onUnsubscribe() {
    if (!this.hasListeners()) {
      this.cleanup?.()
      this.cleanup = undefined
    }
  }

  setEventListener(setup: SetupFn): void {
    this.setup = setup
    this.cleanup?.()
    this.cleanup = setup((online?: boolean) => {
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
    this.listeners.forEach((listener) => {
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
}

export const onlineManager = new OnlineManager()
