/**
 * Base class that implements the subscribe/unsubscribe pattern used throughout
 * TanStack Query. Caches, observers, and managers such as `QueryCache`,
 * `MutationCache`, `QueryObserver`, `FocusManager`, and `OnlineManager` extend
 * it to notify listeners about state changes.
 *
 * Subclasses can override the `onSubscribe` and `onUnsubscribe` hooks to set
 * up and tear down resources (e.g. global event listeners) as listeners are
 * added and removed.
 */
export class Subscribable<TListener extends Function> {
  protected listeners = new Set<TListener>()

  constructor() {
    this.subscribe = this.subscribe.bind(this)
  }

  /**
   * `subscribe` registers a listener that is called whenever the subclass
   * notifies about a change, and returns an unsubscribe function that removes
   * the listener again.
   *
   * The method is bound to its instance, so it can be destructured or passed
   * around as a standalone function.
   *
   * @example
   * ```ts
   * import { focusManager } from '@tanstack/query-core'
   *
   * const unsubscribe = focusManager.subscribe((focused) => {
   *   console.log('focused:', focused)
   * })
   *
   * // Stop listening
   * unsubscribe()
   * ```
   */
  subscribe(listener: TListener): () => void {
    this.listeners.add(listener)

    this.onSubscribe()

    return () => {
      this.listeners.delete(listener)
      this.onUnsubscribe()
    }
  }

  /**
   * `hasListeners` can be used to check whether at least one listener is
   * currently subscribed.
   */
  hasListeners(): boolean {
    return this.listeners.size > 0
  }

  /**
   * Lifecycle hook that is called after a listener has subscribed. Subclasses
   * can override it to set up resources, such as attaching global event
   * listeners, when listeners subscribe.
   */
  protected onSubscribe(): void {
    // Do nothing
  }

  /**
   * Lifecycle hook that is called after a listener has unsubscribed.
   * Subclasses can override it to release resources when listeners unsubscribe.
   */
  protected onUnsubscribe(): void {
    // Do nothing
  }
}
