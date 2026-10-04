import { expect, it } from 'vitest'
import { createRoot, createSignal } from 'solid-js'
import { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'

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
