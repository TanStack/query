import { describe, expect, it, vi } from 'vitest'
import { subscribe } from '../subscribe'

describe('subscribe', () => {
  it('should unsubscribe the listener on dispose', () => {
    const listeners = new Set<() => void>()
    const subscribable = {
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
    }
    const listener = vi.fn<() => void>()
    {
      using _subscription = subscribe(subscribable, listener)
      expect(listeners).toStrictEqual(new Set([listener]))
    }
    expect(listeners.size).toBe(0)
  })
})
