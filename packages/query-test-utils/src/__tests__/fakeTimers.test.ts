import { describe, expect, it, vi } from 'vitest'
import { fakeTimers } from '../fakeTimers'

describe('fakeTimers', () => {
  it('should use fake timers until it is disposed', () => {
    {
      using _timers = fakeTimers()
      expect(vi.isFakeTimers()).toBe(true)
    }
    expect(vi.isFakeTimers()).toBe(false)
  })
})
