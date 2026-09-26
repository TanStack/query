import { Subscribable } from './subscribable'

type Listener = (focused: boolean) => void

type SetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined

/**
 * The `FocusManager` manages the focus state within TanStack Query.
 *
 * It can be used to change the default event listeners or to manually change the focus state.
 */
export class FocusManager extends Subscribable<Listener> {
  #focused?: boolean
  #cleanup?: () => void

  #setup: SetupFn

  constructor() {
    super()
    this.#setup = (onFocus) => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeof window !== 'undefined' && window.addEventListener) {
        const listener = () => onFocus()
        // Listen to visibilitychange
        window.addEventListener('visibilitychange', listener, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', listener)
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
   * be used to determine the focus state. The provided `setup` function
   * receives a `setFocused` callback: call it with a `boolean` to manually
   * set the focus state, or with no arguments to re-evaluate the current
   * focus state and notify subscribers.
   *
   * @example
   * ```ts
   * import { focusManager } from '@tanstack/query-core'
   *
   * focusManager.setEventListener((handleFocus) => {
   *   const listener = () => handleFocus()
   *   // Listen to visibilitychange
   *   if (typeof window !== 'undefined' && window.addEventListener) {
   *     window.addEventListener('visibilitychange', listener, false)
   *   }
   *
   *   return () => {
   *     // Be sure to unsubscribe if a new handler is set
   *     window.removeEventListener('visibilitychange', listener)
   *   }
   * })
   * ```
   */
  setEventListener(setup: SetupFn): void {
    this.#setup = setup
    this.#cleanup?.()
    this.#cleanup = setup((focused) => {
      if (typeof focused === 'boolean') {
        this.setFocused(focused)
      } else {
        this.onFocus()
      }
    })
  }

  /**
   * `setFocused` can be used to manually set the focus state. Set `undefined`
   * to fall back to the default focus check.
   *
   * @example
   * ```ts
   * import { focusManager } from '@tanstack/query-core'
   *
   * // Set focused
   * focusManager.setFocused(true)
   *
   * // Set unfocused
   * focusManager.setFocused(false)
   *
   * // Fallback to the default focus check
   * focusManager.setFocused(undefined)
   * ```
   */
  setFocused(focused?: boolean): void {
    const changed = this.#focused !== focused
    if (changed) {
      this.#focused = focused
      this.onFocus()
    }
  }

  /**
   * `onFocus` notifies all subscribed listeners with the current focus state.
   */
  onFocus(): void {
    const isFocused = this.isFocused()
    this.listeners.forEach((listener) => {
      listener(isFocused)
    })
  }

  /**
   * `isFocused` can be used to get the current focus state.
   */
  isFocused(): boolean {
    if (typeof this.#focused === 'boolean') {
      return this.#focused
    }

    // document global can be unavailable in react native
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return globalThis.document?.visibilityState !== 'hidden'
  }
}

/**
 * Singleton instance of {@link FocusManager}, used to manage and observe the focus state within TanStack Query.
 */
export const focusManager = new FocusManager()
