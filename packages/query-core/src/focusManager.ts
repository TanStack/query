import { Subscribable } from './subscribable'
import { isServer } from './utils'

type Listener = (focused: boolean) => void

type SetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined

export class FocusManager extends Subscribable<Listener> {
  #focused?: boolean
  #cleanup?: () => void

  #setup: SetupFn

  constructor() {
    super()
    this.#setup = (onFocus) => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isServer && window.addEventListener) {
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

  setFocused(focused?: boolean): void {
    const changed = this.#focused !== focused
    if (changed) {
      this.#focused = focused
      this.onFocus()
    }
  }

  onFocus(): void {
    const isFocused = this.isFocused()
    this.listeners.forEach((listener) => {
      listener(isFocused)
    })
  }

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
 * The `FocusManager` manages the focus state within TanStack Query.
 * 
 * It can be used to change the default event listeners or to manually change the focus state.
 * 
 * Its available methods are:
 *
 * - [`setEventListener`](#focusmanagerseteventlistener)
 * - [`subscribe`](#focusmanagersubscribe)
 * - [`setFocused`](#focusmanagersetfocused)
 * - [`isFocused`](#focusmanagerisfocused)
 *
 * ## `focusManager.setEventListener`
 * 
 * `setEventListener` can be used to set a custom event listener:
 * 
 * ```tsx
 * import { focusManager } from '@tanstack/react-query'
 * 
 * focusManager.setEventListener((handleFocus) => {
 *   // Listen to visibilitychange
 *   if (typeof window !== 'undefined' && window.addEventListener) {
 *     window.addEventListener('visibilitychange', handleFocus, false)
 *   }
 * 
 *   return () => {
 *     // Be sure to unsubscribe if a new handler is set
 *     window.removeEventListener('visibilitychange', handleFocus)
 *   }
 * })
 * ```
 * 
 * ## `focusManager.subscribe`
 * 
 * `subscribe` can be used to subscribe to changes in the visibility state. It returns an unsubscribe function:
 * 
 * ```tsx
 * import { focusManager } from '@tanstack/react-query'
 * 
 * const unsubscribe = focusManager.subscribe((isVisible) => {
 *   console.log('isVisible', isVisible)
 * })
 * ```
 * 
 * ## `focusManager.setFocused`
 * 
 * `setFocused` can be used to manually set the focus state. Set `undefined` to fall back to the default focus check.
 * 
 * ```tsx
 * import { focusManager } from '@tanstack/react-query'
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
 * 
 * **Options**
 * 
 * - `focused: boolean | undefined`
 * 
 * ## `focusManager.isFocused`
 * 
 * `isFocused` can be used to get the current focus state.
 * 
 * ```tsx
 * const isFocused = focusManager.isFocused()
 * ```
 */
export const focusManager = new FocusManager()
