import { onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'

export function createCacheSubscriptionRegistry<TCache, TEvent>() {
  const subscriptions = new Map<
    symbol,
    {
      shouldUpdate: (event: TEvent) => boolean
      update: (cache: Accessor<TCache>) => void
    }
  >()

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
