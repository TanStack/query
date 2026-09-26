/**
 * The base class behind everything in Query that you can subscribe to: `QueryCache`, `MutationCache`,
 * the observers, and the `FocusManager`/`OnlineManager` behind `focusManager` and `onlineManager`.
 * Subclasses decide what a listener receives and when it is called.
 */
export class Subscribable<TListener extends Function> {
  protected listeners = new Set<TListener>()

  constructor() {
    this.subscribe = this.subscribe.bind(this)
  }

  /**
   * Registers a listener to be called on every update this object notifies about. Returns a function
   * that removes the listener again — call it to stop listening. The base class never drops a listener
   * on its own, though some subclasses clear all of theirs in `destroy()`.
   * @param listener - Called on each update, with whatever the subclass passes to its subscribers.
   * @example
   * ```ts
   * const unsubscribe = subscribable.subscribe(() => {
   *   // react to the update
   * })
   *
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
   * Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.
   */
  hasListeners(): boolean {
    return this.listeners.size > 0
  }

  protected onSubscribe(): void {
    // Do nothing
  }

  protected onUnsubscribe(): void {
    // Do nothing
  }
}
