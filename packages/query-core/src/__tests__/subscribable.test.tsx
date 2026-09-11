import { describe, expect, it, vi } from 'vitest'
import { Subscribable } from '../subscribable'

type Listener = () => void

class SubscribableTest extends Subscribable<Listener> {
  onSubscribeSpy = vi.fn()
  onUnsubscribeSpy = vi.fn()

  protected onSubscribe(): void {
    this.onSubscribeSpy()
  }

  protected onUnsubscribe(): void {
    this.onUnsubscribeSpy()
  }
}

describe('Subscribable', () => {
  it('should call onSubscribe when a listener subscribes', () => {
    const subscribable = new SubscribableTest()

    subscribable.subscribe(() => undefined)

    expect(subscribable.onSubscribeSpy).toHaveBeenCalledTimes(1)
    expect(subscribable.onUnsubscribeSpy).toHaveBeenCalledTimes(0)
  })

  it('should call onSubscribe once per subscribe call', () => {
    const subscribable = new SubscribableTest()

    subscribable.subscribe(() => undefined)
    subscribable.subscribe(() => undefined)

    expect(subscribable.onSubscribeSpy).toHaveBeenCalledTimes(2)
  })

  it('should call onUnsubscribe when a listener unsubscribes', () => {
    const subscribable = new SubscribableTest()

    const unsubscribe = subscribable.subscribe(() => undefined)
    unsubscribe()

    expect(subscribable.onUnsubscribeSpy).toHaveBeenCalledTimes(1)
  })

  it('should return `false` from hasListeners when there are no listeners', () => {
    const subscribable = new SubscribableTest()

    expect(subscribable.hasListeners()).toBe(false)
  })

  it('should return `true` from hasListeners while a listener is subscribed', () => {
    const subscribable = new SubscribableTest()

    subscribable.subscribe(() => undefined)

    expect(subscribable.hasListeners()).toBe(true)
  })

  it('should return `false` from hasListeners after the last listener unsubscribes', () => {
    const subscribable = new SubscribableTest()

    const unsubscribe = subscribable.subscribe(() => undefined)
    unsubscribe()

    expect(subscribable.hasListeners()).toBe(false)
  })

  it('should still have listeners while at least one remains subscribed', () => {
    const subscribable = new SubscribableTest()

    const unsubscribe1 = subscribable.subscribe(() => undefined)
    subscribable.subscribe(() => undefined)

    unsubscribe1()

    expect(subscribable.hasListeners()).toBe(true)
  })

  it('should deduplicate the same listener reference', () => {
    const subscribable = new SubscribableTest()
    const listener = () => undefined

    subscribable.subscribe(listener)
    subscribable.subscribe(listener)

    expect(subscribable.hasListeners()).toBe(true)

    const unsubscribe = subscribable.subscribe(listener)
    unsubscribe()

    expect(subscribable.hasListeners()).toBe(false)
  })

  it('should keep a stable subscribe reference when destructured', () => {
    const subscribable = new SubscribableTest()
    const { subscribe } = subscribable

    const unsubscribe = subscribe(() => undefined)

    expect(subscribable.onSubscribeSpy).toHaveBeenCalledTimes(1)
    expect(subscribable.hasListeners()).toBe(true)

    unsubscribe()

    expect(subscribable.hasListeners()).toBe(false)
  })
})
