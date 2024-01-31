import { Store } from '@tanstack/store'
import { isServer } from './utils'

type SetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined

export class FocusManager {
  #cleanup: undefined | (() => void)
  store = new Store<boolean | undefined>(undefined, {
    onSubscribe: () => {
      if (!this.#cleanup) this.setEventListener(this.#setup)

      return () => {
        if (!this.store.listeners.size) {
          this.#cleanup?.()
          this.#cleanup = undefined;
        }
      }
    },
  })

  #setup: SetupFn = (onFocus) => {
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

  setEventListener(setup: SetupFn): void {
    this.#setup = setup
    this.#cleanup?.()
    this.#cleanup = this.#setup((focused) => {
      this.setFocused(focused)
    })
  }

  setFocused(focused?: boolean): void {
    const changed = this.store.state !== focused;
    if (!changed) return;
    this.store.setState(() => focused)
  }

  subscribe(fn: () => void) {
    return this.store.subscribe(fn);
  }

  isFocused(): boolean {
    if (typeof this.store.state === 'boolean') {
      return this.store.state
    }

    // document global can be unavailable in react native
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return globalThis.document?.visibilityState !== 'hidden'
  }
}

export const focusManager = new FocusManager()
