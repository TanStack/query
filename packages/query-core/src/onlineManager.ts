import { Store } from '@tanstack/store'
import { isServer } from './utils'

type Listener = (online: boolean) => void
type SetupFn = (setOnline: Listener) => (() => void) | undefined

export class OnlineManager {
  store = new Store(true, {
    onSubscribe: () => {
      if (!this.#cleanup) this.setEventListener(this.#setup)

      return () => {
        if (!this.store.listeners.size) {
          this.#cleanup?.()
          this.#cleanup = undefined
        }
      }
    },
  })
  #cleanup?: () => void

  #setup: SetupFn = (onOnline) => {
    // addEventListener does not exist in React Native, but window does
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!isServer && window.addEventListener) {
      const onlineListener = () => onOnline(true)
      const offlineListener = () => onOnline(false)
      // Listen to online
      window.addEventListener('online', onlineListener, false)
      window.addEventListener('offline', offlineListener, false)

      return () => {
        // Be sure to unsubscribe if a new handler is set
        window.removeEventListener('online', onlineListener)
        window.removeEventListener('offline', offlineListener)
      }
    }

    return
  }

  setEventListener(setup: SetupFn): void {
    this.#setup = setup
    this.#cleanup?.()
    this.#cleanup = setup(this.setOnline.bind(this))
  }

  setOnline(online: boolean): void {
    const changed = this.store.state !== online

    if (!changed) return
    this.store.setState(() => online)
  }

  subscribe(fn: (state: boolean) => void) {
    return this.store.subscribe(() => fn(this.store.state))
  }

  isOnline(): boolean {
    return this.store.state
  }
}

export const onlineManager = new OnlineManager()
