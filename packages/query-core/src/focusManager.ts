import { EventManager, listenToWindow } from './eventManager'

/**
 * The `FocusManager` manages the focus state within TanStack Query.
 *
 * It can be used to change the default event listeners or to manually change the focus state.
 */
export class FocusManager extends EventManager<(focused?: boolean) => void> {
  #focused?: boolean
  constructor() {
    super((onFocus) => listenToWindow('visibilitychange', () => onFocus()))
  }

  protected getListener() {
    return (focused?: boolean) => {
      if (typeof focused === 'boolean') this.setFocused(focused)
      else this.onFocus()
    }
  }

  /**
   * `setFocused` can be used to manually set the focus state. Set `undefined`
   * to fall back to the default focus check.
   * @param focused - The focus state, or `undefined` to use the default focus check.
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
   * @returns The focus state set with `setFocused`, or otherwise whether the document is visible.
   */
  isFocused(): boolean {
    if (typeof this.#focused === 'boolean') {
      return this.#focused
    }

    // document global can be unavailable in react native
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    return globalThis.document?.visibilityState !== 'hidden'
  }
}

/**
 * Singleton instance of {@link FocusManager}, used to manage and observe the focus state within TanStack Query.
 */
export const focusManager = new FocusManager()
