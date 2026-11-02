/**
 * Subscribes a listener, like a `QueryObserver`'s, until the returned object is disposed, for a
 * test to hold with `using`.
 * @param subscribable - What to subscribe to, like a `QueryObserver` or a `QueryCache`.
 * @param listener - The listener to subscribe.
 * @returns A disposable that unsubscribes the listener.
 * @example
 * ```ts
 * it('fetches', () => {
 *   using _subscription = subscribe(new QueryObserver(queryClient, options), noop)
 * })
 * ```
 */
export const subscribe = <TListener>(
  subscribable: { subscribe: (listener: TListener) => () => void },
  listener: NoInfer<TListener>,
): Disposable => {
  const unsubscribe = subscribable.subscribe(listener)
  return {
    [Symbol.dispose]: () => {
      unsubscribe()
    },
  }
}
