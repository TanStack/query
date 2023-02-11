import { Subscribable } from './subscribable'
import { isServer } from './utils'

type SetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined

export class FocusManager extends Subscribable {
  private focused?: boolean
  private cleanup?: () => void

  private setup: SetupFn

  constructor() {
    super()
    this.setup = (onFocus) => {
      // addEventListener does not exist in React Native, but window does
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isServer && window.addEventListener) {
        const listener = () => onFocus()
        // Listen to visibillitychange and focus
        window.addEventListener('visibilitychange', listener, false)
        window.addEventListener('focus', listener, false)

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', listener)
          window.removeEventListener('focus', listener)
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
    this.cleanup = setup((focused) => {
      if (typeof focused === 'boolean') {
        this.setFocused(focused)
      } else {
        this.onFocus()
      }
    })
  }

  setFocused(focused?: boolean): void {
    this.focused = focused

    if (focused) {
      this.onFocus()
    }
  }

  onFocus(): void {
    this.listeners.forEach((listener) => {
      listener()
    })
  }

  isFocused(): boolean {
    if (typeof this.focused === 'boolean') {
      return this.focused
    }

    // document global can be unavailable in react native
    if (typeof document === 'undefined') {
      return true
    }

    return [undefined, 'visible', 'prerender'].includes(
      document.visibilityState,
    )
  }
}

export const focusManager = new FocusManager()
