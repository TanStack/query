import { describe, expect, it, vi } from 'vitest'
import { clearOnDispose, fakeTimers } from '..'

describe('fakeTimers', () => {
  it('should use fake timers until it is disposed', () => {
    {
      using _timers = fakeTimers()
      expect(vi.isFakeTimers()).toBe(true)
    }
    expect(vi.isFakeTimers()).toBe(false)
  })
})

describe('clearOnDispose', () => {
  it('should clear the client when it is disposed', () => {
    const clear = vi.fn<() => void>()
    {
      using client = clearOnDispose({ clear })
      expect(client.clear).toBe(clear)
      expect(clear).not.toHaveBeenCalled()
    }
    expect(clear).toHaveBeenCalledTimes(1)
  })
})
