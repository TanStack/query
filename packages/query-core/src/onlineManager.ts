import { EventManager, listenToWindow } from './eventManager'

/**
 * The `OnlineManager` manages the online state within TanStack Query. It can
 * be used to change the default event listeners or to manually change the
 * online state.
 *
 * By default, the `onlineManager` assumes an active network connection, and
 * listens to the `online` and `offline` events on the `window` object to
 * detect changes.
 */
export class OnlineManager extends EventManager<(online: boolean) => void> {
  #online = true
  constructor() {
    super((onOnline) => {
      const online = listenToWindow('online', () => onOnline(true))
      if (!online) return undefined
      const offline = listenToWindow('offline', () => onOnline(false))
      return () => {
        online()
        offline?.()
      }
    })
  }

  protected getListener() {
    return this.setOnline.bind(this)
  }

  /**
   * `setOnline` can be used to manually set the online state.
   * @param online - The online state.
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
   * @returns `true` if online.
   */
  isOnline(): boolean {
    return this.#online
  }
}

/**
 * Singleton instance of {@link OnlineManager}, used to manage and observe the online state within TanStack Query.
 */
export const onlineManager = new OnlineManager()
