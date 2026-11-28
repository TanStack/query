import { Subscribable } from './subscribable'

type Setup<TListener> = (listener: TListener) => (() => void) | undefined

/** Registers an environment listener while the first to last subscriber is active. */
export abstract class EventManager<TListener> extends Subscribable<(value: boolean) => void> {
  #cleanup?: () => void
  #setup: Setup<TListener>

  constructor(setup: Setup<TListener>) {
    super()
    this.#setup = setup
  }

  protected abstract getListener(): TListener

  protected override onSubscribe(): void {
    if (!this.#cleanup) this.setEventListener(this.#setup)
  }

  protected override onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.#cleanup?.()
      this.#cleanup = undefined
    }
  }

  /**
   * Replaces the source of environment events and cleans up the previous source.
   * @param setup - Registers the callback, optionally returning its cleanup function.
   */
  setEventListener(setup: Setup<TListener>): void {
    this.#setup = setup
    this.#cleanup?.()
    this.#cleanup = setup(this.getListener())
  }
}

/** Listens for browser events when a window with DOM event support is available. */
export function listenToWindow(type: 'visibilitychange' | 'online' | 'offline', listener: () => void) {
  // React Native may expose a window without DOM event methods.
  if (typeof window === 'undefined' || !window.addEventListener) return undefined
  window.addEventListener(type, listener, false)
  return () => window.removeEventListener(type, listener)
}
