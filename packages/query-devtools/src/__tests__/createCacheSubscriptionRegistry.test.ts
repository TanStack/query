import { createRoot, createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'

describe('createCacheSubscriptionRegistry', () => {
  it('should skip disposed subscriptions without dropping other queued updates', () => {
    const registry = createCacheSubscriptionRegistry<number, undefined>()
    const queued: Array<() => void> = []
    const [firstValue, setFirstValue] = createSignal(0)
    const [secondValue, setSecondValue] = createSignal(0)
    const firstDispose = createRoot((dispose) => {
      registry.register((cache) => cache(), setFirstValue)
      return dispose
    })
    const secondDispose = createRoot((dispose) => {
      registry.register((cache) => cache(), setSecondValue)
      return dispose
    })

    try {
      registry.notify(
        () => 1,
        undefined,
        (update) => queued.push(update),
      )
      firstDispose()
      queued.forEach((update) => update())

      expect(firstValue()).toBe(0)
      expect(secondValue()).toBe(1)

      registry.notify(() => 2, undefined)
      expect(firstValue()).toBe(0)
      expect(secondValue()).toBe(2)
    } finally {
      firstDispose()
      secondDispose()
    }
  })

  it('should pass the same id to schedule for repeated updates of one subscription', () => {
    const registry = createCacheSubscriptionRegistry<number, undefined>()
    const pending = new Map<symbol, () => void>()
    const [firstValue, setFirstValue] = createSignal(0)
    const [secondValue, setSecondValue] = createSignal(0)
    const dispose = createRoot((disposeRoot) => {
      registry.register((cache) => cache(), setFirstValue)
      registry.register((cache) => cache() * 10, setSecondValue)
      return disposeRoot
    })

    try {
      registry.notify(
        () => 1,
        undefined,
        (update, id) => pending.set(id, update),
      )
      registry.notify(
        () => 2,
        undefined,
        (update, id) => pending.set(id, update),
      )
      expect(pending.size).toBe(2)

      pending.forEach((update) => update())

      expect(firstValue()).toBe(2)
      expect(secondValue()).toBe(20)
    } finally {
      dispose()
    }
  })
})
