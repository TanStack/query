import { Subscribable } from './subscribable'

type Listener = (online: boolean) => void
type SetupFn = (setOnline: Listener) => (() => void) | undefined

/**
 * The `OnlineManager` manages the online state within TanStack Query. It can
 * be used to change the default event listeners or to manually change the
 * online state.
 *
 * By default, the `onlineManager` assumes an active network connection, and
 * listens to the `online` and `offline` events on the `window` object to
 * detect changes.
 */
export class OnlineManager extends Subscribable<Listener> {
  #online = true
  #cleanup?: () => void

  #setup: SetupFn

  constructor() {
    super()
    this.#setup = (onOnline) => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeof window !== 'undefined' && window.addEventListener) {
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
  }

  protected onSubscribe(): void {
    if (!this.#cleanup) {
      this.setEventListener(this.#setup)
    }
  }

  protected onUnsubscribe() {
    if (!this.hasListeners()) {
      this.#cleanup?.()
      this.#cleanup = undefined
    }
  }

  /**
   * `setEventListener` can be used to set a custom event listener that will
   * be used to determine the online state. The provided `setup` function
   * receives a `setOnline` callback that should be called with a `boolean`
   * whenever the online state changes.
   *
   * @example
   * ```ts
   * import NetInfo from '@react-native-community/netinfo'
   * import { onlineManager } from '@tanstack/query-core'
   *
   * onlineManager.setEventListener((setOnline) => {
   *   return NetInfo.addEventListener((state) => {
   *     setOnline(!!state.isConnected)
   *   })
   * })
   * ```
   */
  setEventListener(setup: SetupFn): void {
    this.#setup = setup
    this.#cleanup?.()
    this.#cleanup = setup(this.setOnline.bind(this))
  }

  /**
   * `setOnline` can be used to manually set the online state.
   *
   * @example
   * ```ts
   * import { onlineManager } from '@tanstack/query-core'
   *
   * // Set to online
   * onlineManager.setOnline(true)
   *
   * // Set to offline
   * onlineManager.setOnline(false)
   * ```
   */
  setOnline(online: boolean): void {
    const changed = this.#online !== online

    if (changed) {
      this.#online = online
      this.listeners.forEach((listener) => {
        listener(online)
      })
    }
  }

  /**
   * `isOnline` can be used to get the current online state.
   */
  isOnline(): boolean {
    return this.#online
  }
}

/**
 * Singleton instance of {@link OnlineManager}, used to manage and observe the online state within TanStack Query.
 */
export const onlineManager = new OnlineManager()
