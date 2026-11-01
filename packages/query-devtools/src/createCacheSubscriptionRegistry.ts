import { onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'

/**
 * Creates a registry of components subscribed to a cache, so each one only updates for the cache
 * events it cares about.
 * @returns The `register` and `notify` functions of the registry.
 */
export function createCacheSubscriptionRegistry<TCache, TEvent>() {
  const subscriptions = new Map<
    symbol,
    {
      shouldUpdate: (event: TEvent) => boolean
      update: (cache: Accessor<TCache>) => void
    }
  >()

  /**
   * Registers a subscription that is removed when the current owner is cleaned up.
   * @param callback - Computes the value from the cache.
   * @param setter - Receives the computed value on every update.
   * @param shouldUpdate - Decides whether an event updates this subscription. Defaults to every
   * event.
   */
  function register<T>(
    callback: (cache: Accessor<TCache>) => Exclude<T, Function>,
    setter: Setter<T>,
    shouldUpdate: (event: TEvent) => boolean = () => true,
  ) {
    const id = Symbol()
    subscriptions.set(id, {
      shouldUpdate,
      update: (cache) => setter(callback(cache)),
    })
    onCleanup(() => subscriptions.delete(id))
  }

  /**
   * Updates every subscription whose `shouldUpdate` accepts the event.
   * @param cache - The cache to compute the values from.
   * @param event - The cache event.
   * @param schedule - Runs each update. Defaults to running it right away.
   */
  function notify(
    cache: Accessor<TCache>,
    event: TEvent,
    schedule: (update: () => void) => void = (update) => update(),
  ) {
    for (const [id, subscription] of subscriptions) {
      if (!subscription.shouldUpdate(event)) continue
      schedule(() => {
        if (subscriptions.has(id)) subscription.update(cache)
      })
    }
  }

  return { register, notify }
}
